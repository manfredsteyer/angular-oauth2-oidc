import { Injectable, NgZone, Optional, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, Subscription, of, race, from } from 'rxjs';
import { filter, delay, first, tap, map, switchMap } from 'rxjs/operators';

import {
    ValidationHandler,
    ValidationParams
} from './token-validation/validation-handler';
import { UrlHelperService } from './url-helper.service';
import {
    OAuthEvent,
    OAuthInfoEvent,
    OAuthErrorEvent,
    OAuthSuccessEvent
} from './events';
import {
    OAuthLogger,
    OAuthStorage,
    LoginOptions,
    ParsedIdToken,
    OidcDiscoveryDoc,
    TokenResponse,
    UserInfo
} from './types';
import { b64DecodeUnicode, base64UrlEncode } from './base64-helper';
import { AuthConfig } from './auth.config';
import { WebHttpUrlEncodingCodec } from './encoder';
import { CryptoHandler } from './token-validation/crypto-handler';

/**
 * Service for logging in and logging out with
 * OIDC and OAuth2. Supports implicit flow and
 * password flow.
 */
@Injectable()
export class OAuthService extends AuthConfig implements OnDestroy {
    // Extending AuthConfig ist just for LEGACY reasons
    // to not break existing code.

    /**
     * The ValidationHandler used to validate received
     * id_tokens.
     */
    public tokenValidationHandler: ValidationHandler;

    /**
     * @internal
     * Deprecated:  use property events instead
     */
    public discoveryDocumentLoaded = false;

    /**
     * @internal
     * Deprecated:  use property events instead
     */
    public discoveryDocumentLoaded$: Observable<object>;

    /**
     * Informs about events, like token_received or token_expires.
     * See the string enum EventType for a full list of event types.
     */
    public events: Observable<OAuthEvent>;

    /**
     * The received (passed around) state, when logging
     * in with implicit flow.
     */
    public state? = '';

    protected eventsSubject: Subject<OAuthEvent> = new Subject<OAuthEvent>();
    protected discoveryDocumentLoadedSubject: Subject<object> = new Subject<object>();
    protected silentRefreshPostMessageEventListener: EventListener;
    protected grantTypesSupported: Array<string> = [];
    protected _storage: OAuthStorage;
    protected accessTokenTimeoutSubscription: Subscription;
    protected idTokenTimeoutSubscription: Subscription;
    protected sessionCheckEventListener: EventListener;
    protected jwksUri: string;
    protected sessionCheckTimer: any;
    protected silentRefreshSubject: string;
    protected inImplicitFlow = false;

    constructor(
        protected ngZone: NgZone,
        protected http: HttpClient,
        @Optional() storage: OAuthStorage,
        @Optional() tokenValidationHandler: ValidationHandler,
        @Optional() protected config: AuthConfig,
        protected urlHelper: UrlHelperService,
        protected logger: OAuthLogger,
        @Optional() protected crypto: CryptoHandler,
    ) {
        super();

        this.debug('angular-oauth2-oidc v8-beta');

        this.discoveryDocumentLoaded$ = this.discoveryDocumentLoadedSubject.asObservable();
        this.events = this.eventsSubject.asObservable();

        if (tokenValidationHandler) {
            this.tokenValidationHandler = tokenValidationHandler;
        }

        if (config) {
            this.configure(config);
        }

        try {
            if (storage) {
                this.setStorage(storage);
            } else if (typeof sessionStorage !== 'undefined') {
                this.setStorage(sessionStorage);
            }
        } catch (e) {

            console.error(
                'No OAuthStorage provided and cannot access default (sessionStorage).'
                + 'Consider providing a custom OAuthStorage implementation in your module.',
                e
            );
        }

        this.setupRefreshTimer();
    }

    /**
     * Use this method to configure the service
     * @param config the configuration
     */
    public configure(config: AuthConfig) {
        // For the sake of downward compatibility with
        // original configuration API
        Object.assign(this, new AuthConfig(), config);

        this.config = Object.assign({} as AuthConfig, new AuthConfig(), config);

        if (this.sessionChecksEnabled) {
            this.setupSessionCheck();
        }

        this.configChanged();
    }

    protected configChanged(): void {
        this.setupRefreshTimer();
    }

    public restartSessionChecksIfStillLoggedIn(): void {
        if (this.hasValidIdToken()) {
            this.initSessionCheck();
        }
    }

    protected restartRefreshTimerIfStillLoggedIn(): void {
        this.setupExpirationTimers();
    }

    protected setupSessionCheck() {
        this.events.pipe(filter(e => e.type === 'token_received')).subscribe(e => {
            this.initSessionCheck();
        });
    }

    /**
     * Will setup up silent refreshing for when the token is
     * about to expire. When the user is logged out via this.logOut method, the
     * silent refreshing will pause and not refresh the tokens until the user is
     * logged back in via receiving a new token.
     * @param params Additional parameter to pass
     * @param listenTo Setup automatic refresh of a specific token type
     */
    public setupAutomaticSilentRefresh(params: object = {}, listenTo?: 'access_token' | 'id_token' | 'any', noPrompt = true) {
      let shouldRunSilentRefresh = true;
      this.events.pipe(
        tap((e) => {
          if (e.type === 'token_received') {
            shouldRunSilentRefresh = true;
          } else if (e.type === 'logout') {
            shouldRunSilentRefresh = false;
          }
        }),
        filter(e => e.type === 'token_expires')
      ).subscribe(e => {
        const event = e as OAuthInfoEvent;
        if ((listenTo == null || listenTo === 'any' || event.info === listenTo) && shouldRunSilentRefresh) {
          // this.silentRefresh(params, noPrompt).catch(_ => {
          this.refreshInternal(params, noPrompt).catch(_ => {
            this.debug('Automatic silent refresh did not work');
          });
        }
      });

      this.restartRefreshTimerIfStillLoggedIn();
    }

    protected refreshInternal(params, noPrompt) {
        if (this.responseType === 'code') {
            return this.refreshToken();
        } else {
            return this.silentRefresh(params, noPrompt);
        }
    }

    /**
     * Convenience method that first calls `loadDiscoveryDocument(...)` and
     * directly chains using the `then(...)` part of the promise to call
     * the `tryLogin(...)` method.
     *
     * @param options LoginOptions to pass through to `tryLogin(...)`
     */
    public loadDiscoveryDocumentAndTryLogin(options: LoginOptions = null): Promise<boolean> {
        return this.loadDiscoveryDocument().then(doc => {
            return this.tryLogin(options);
        });
    }

    /**
     * Convenience method that first calls `loadDiscoveryDocumentAndTryLogin(...)`
     * and if then chains to `initImplicitFlow()`, but only if there is no valid
     * IdToken or no valid AccessToken.
     *
     * @param options LoginOptions to pass through to `tryLogin(...)`
     */
    public loadDiscoveryDocumentAndLogin(options: LoginOptions = null): Promise<boolean> {
        return this.loadDiscoveryDocumentAndTryLogin(options).then(_ => {
            if (!this.hasValidIdToken() || !this.hasValidAccessToken()) {
                this.initImplicitFlow();
                return false;
            } else {
                return true;
            }
        });
    }

    protected debug(...args): void {
        if (this.showDebugInformation) {
            this.logger.debug.apply(console, args);
        }
    }

    protected validateUrlFromDiscoveryDocument(url: string): string[] {
        const errors: string[] = [];
        const httpsCheck = this.validateUrlForHttps(url);
        const issuerCheck = this.validateUrlAgainstIssuer(url);

        if (!httpsCheck) {
            errors.push(
                'https for all urls required. Also for urls received by discovery.'
            );
        }

        if (!issuerCheck) {
            errors.push(
                'Every url in discovery document has to start with the issuer url.' +
                'Also see property strictDiscoveryDocumentValidation.'
            );
        }

        return errors;
    }

    protected validateUrlForHttps(url: string): boolean {
        if (!url) {
            return true;
        }

        const lcUrl = url.toLowerCase();

        if (this.requireHttps === false) {
            return true;
        }

        if (
            (lcUrl.match(/^http:\/\/localhost($|[:\/])/) ||
                lcUrl.match(/^http:\/\/localhost($|[:\/])/)) &&
            this.requireHttps === 'remoteOnly'
        ) {
            return true;
        }

        return lcUrl.startsWith('https://');
    }

    protected validateUrlAgainstIssuer(url: string) {
        if (!this.strictDiscoveryDocumentValidation) {
            return true;
        }
        if (!url) {
            return true;
        }
        return url.toLowerCase().startsWith(this.issuer.toLowerCase());
    }

    protected setupRefreshTimer(): void {
        if (typeof window === 'undefined') {
            this.debug('timer not supported on this plattform');
            return;
        }

        if (this.hasValidIdToken()) {
            this.clearAccessTokenTimer();
            this.clearIdTokenTimer();
            this.setupExpirationTimers();
        }

        this.events.pipe(filter(e => e.type === 'token_received')).subscribe(_ => {
            this.clearAccessTokenTimer();
            this.clearIdTokenTimer();
            this.setupExpirationTimers();
        });
    }

    protected setupExpirationTimers(): void {
        const idTokenExp = this.getIdTokenExpiration() || Number.MAX_VALUE;
        const accessTokenExp = this.getAccessTokenExpiration() || Number.MAX_VALUE;
        const useAccessTokenExp = accessTokenExp <= idTokenExp;

        if (this.hasValidAccessToken() && useAccessTokenExp) {
            this.setupAccessTokenTimer();
        }

        if (this.hasValidIdToken() && !useAccessTokenExp) {
            this.setupIdTokenTimer();
        }
    }

    protected setupAccessTokenTimer(): void {
        const expiration = this.getAccessTokenExpiration();
        const storedAt = this.getAccessTokenStoredAt();
        const timeout = this.calcTimeout(storedAt, expiration);

        this.ngZone.runOutsideAngular(() => {
            this.accessTokenTimeoutSubscription = of(
                new OAuthInfoEvent('token_expires', 'access_token')
            )
                .pipe(delay(timeout))
                .subscribe(e => {
                    this.ngZone.run(() => {
                        this.eventsSubject.next(e);
                    });
                });
        });
    }

    protected setupIdTokenTimer(): void {
        const expiration = this.getIdTokenExpiration();
        const storedAt = this.getIdTokenStoredAt();
        const timeout = this.calcTimeout(storedAt, expiration);

        this.ngZone.runOutsideAngular(() => {
            this.idTokenTimeoutSubscription = of(
                new OAuthInfoEvent('token_expires', 'id_token')
            )
                .pipe(delay(timeout))
                .subscribe(e => {
                    this.ngZone.run(() => {
                        this.eventsSubject.next(e);
                    });
                });
        });
    }

    protected clearAccessTokenTimer(): void {
        if (this.accessTokenTimeoutSubscription) {
            this.accessTokenTimeoutSubscription.unsubscribe();
        }
    }

    protected clearIdTokenTimer(): void {
        if (this.idTokenTimeoutSubscription) {
            this.idTokenTimeoutSubscription.unsubscribe();
        }
    }

    protected calcTimeout(storedAt: number, expiration: number): number {
        const now = Date.now();
        const delta = (expiration - storedAt) * this.timeoutFactor - (now - storedAt);
        return Math.max(0, delta);
    }

    /**
     * DEPRECATED. Use a provider for OAuthStorage instead:
     *
     * { provide: OAuthStorage, useFactory: oAuthStorageFactory }
     * export function oAuthStorageFactory(): OAuthStorage { return localStorage; }
     * Sets a custom storage used to store the received
     * tokens on client side. By default, the browser's
     * sessionStorage is used.
     * @ignore
     *
     * @param storage
     */
    public setStorage(storage: OAuthStorage): void {
        this._storage = storage;
        this.configChanged();
    }

    /**
     * Loads the discovery document to configure most
     * properties of this service. The url of the discovery
     * document is infered from the issuer's url according
     * to the OpenId Connect spec. To use another url you
     * can pass it to to optional parameter fullUrl.
     *
     * @param fullUrl
     */
    public loadDiscoveryDocument(fullUrl: string = null): Promise<object> {
        return new Promise((resolve, reject) => {
            if (!fullUrl) {
                fullUrl = this.issuer || '';
                if (!fullUrl.endsWith('/')) {
                    fullUrl += '/';
                }
                fullUrl += '.well-known/openid-configuration';
            }

            if (!this.validateUrlForHttps(fullUrl)) {
                reject('issuer must use https, or config value for property requireHttps must allow http');
                return;
            }

            this.http.get<OidcDiscoveryDoc>(fullUrl).subscribe(
                doc => {
                    if (!this.validateDiscoveryDocument(doc)) {
                        this.eventsSubject.next(
                            new OAuthErrorEvent('discovery_document_validation_error', null)
                        );
                        reject('discovery_document_validation_error');
                        return;
                    }

                    this.loginUrl = doc.authorization_endpoint;
                    this.logoutUrl = doc.end_session_endpoint || this.logoutUrl;
                    this.grantTypesSupported = doc.grant_types_supported;
                    this.issuer = doc.issuer;
                    this.tokenEndpoint = doc.token_endpoint;
                    this.userinfoEndpoint = doc.userinfo_endpoint;
                    this.jwksUri = doc.jwks_uri;
                    this.sessionCheckIFrameUrl = doc.check_session_iframe || this.sessionCheckIFrameUrl;

                    this.discoveryDocumentLoaded = true;
                    this.discoveryDocumentLoadedSubject.next(doc);

                    if (this.sessionChecksEnabled) {
                        this.restartSessionChecksIfStillLoggedIn();
                    }

                    this.loadJwks()
                        .then(jwks => {
                            const result: object = {
                                discoveryDocument: doc,
                                jwks: jwks
                            };

                            const event = new OAuthSuccessEvent(
                                'discovery_document_loaded',
                                result
                            );
                            this.eventsSubject.next(event);
                            resolve(event);
                            return;
                        })
                        .catch(err => {
                            this.eventsSubject.next(
                                new OAuthErrorEvent('discovery_document_load_error', err)
                            );
                            reject(err);
                            return;
                        });
                },
                err => {
                    this.logger.error('error loading discovery document', err);
                    this.eventsSubject.next(
                        new OAuthErrorEvent('discovery_document_load_error', err)
                    );
                    reject(err);
                }
            );
        });
    }

    protected loadJwks(): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            if (this.jwksUri) {
                this.http.get(this.jwksUri).subscribe(
                    jwks => {
                        this.jwks = jwks;
                        this.eventsSubject.next(
                            new OAuthSuccessEvent('discovery_document_loaded')
                        );
                        resolve(jwks);
                    },
                    err => {
                        this.logger.error('error loading jwks', err);
                        this.eventsSubject.next(
                            new OAuthErrorEvent('jwks_load_error', err)
                        );
                        reject(err);
                    }
                );
            } else {
                resolve(null);
            }
        });
    }

    protected validateDiscoveryDocument(doc: OidcDiscoveryDoc): boolean {
        let errors: string[];

        if (!this.skipIssuerCheck && doc.issuer !== this.issuer) {
            this.logger.error(
                'invalid issuer in discovery document',
                'expected: ' + this.issuer,
                'current: ' + doc.issuer
            );
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc.authorization_endpoint);
        if (errors.length > 0) {
            this.logger.error(
                'error validating authorization_endpoint in discovery document',
                errors
            );
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc.end_session_endpoint);
        if (errors.length > 0) {
            this.logger.error(
                'error validating end_session_endpoint in discovery document',
                errors
            );
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc.token_endpoint);
        if (errors.length > 0) {
            this.logger.error(
                'error validating token_endpoint in discovery document',
                errors
            );
        }

        errors = this.validateUrlFromDiscoveryDocument(doc.userinfo_endpoint);
        if (errors.length > 0) {
            this.logger.error(
                'error validating userinfo_endpoint in discovery document',
                errors
            );
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc.jwks_uri);
        if (errors.length > 0) {
            this.logger.error('error validating jwks_uri in discovery document', errors);
            return false;
        }

        if (this.sessionChecksEnabled && !doc.check_session_iframe) {
            this.logger.warn(
                'sessionChecksEnabled is activated but discovery document' +
                ' does not contain a check_session_iframe field'
            );
        }

        return true;
    }

    /**
     * Uses password flow to exchange userName and password for an
     * access_token. After receiving the access_token, this method
     * uses it to query the userinfo endpoint in order to get information
     * about the user in question.
     *
     * When using this, make sure that the property oidc is set to false.
     * Otherwise stricter validations take place that make this operation
     * fail.
     *
     * @param userName
     * @param password
     * @param headers Optional additional http-headers.
     */
    public fetchTokenUsingPasswordFlowAndLoadUserProfile(
        userName: string,
        password: string,
        headers: HttpHeaders = new HttpHeaders()
    ): Promise<object> {
        return this.fetchTokenUsingPasswordFlow(userName, password, headers).then(
            () => this.loadUserProfile()
        );
    }

    /**
     * Loads the user profile by accessing the user info endpoint defined by OpenId Connect.
     *
     * When using this with OAuth2 password flow, make sure that the property oidc is set to false.
     * Otherwise stricter validations take place that make this operation fail.
     */
    public loadUserProfile(): Promise<object> {
        if (!this.hasValidAccessToken()) {
            throw new Error('Can not load User Profile without access_token');
        }
        if (!this.validateUrlForHttps(this.userinfoEndpoint)) {
            throw new Error(
                'userinfoEndpoint must use https, or config value for property requireHttps must allow http'
            );
        }

        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders().set(
                'Authorization',
                'Bearer ' + this.getAccessToken()
            );

            this.http.get<UserInfo>(this.userinfoEndpoint, { headers }).subscribe(
                info => {
                    this.debug('userinfo received', info);

                    const existingClaims = this.getIdentityClaims() || {};

                    if (!this.skipSubjectCheck) {
                        if (
                            this.oidc &&
                            (!existingClaims['sub'] || info.sub !== existingClaims['sub'])
                        ) {
                            const err =
                                'if property oidc is true, the received user-id (sub) has to be the user-id ' +
                                'of the user that has logged in with oidc.\n' +
                                'if you are not using oidc but just oauth2 password flow set oidc to false';

                            reject(err);
                            return;
                        }
                    }

                    info = Object.assign({}, existingClaims, info);

                    this._storage.setItem('id_token_claims_obj', JSON.stringify(info));
                    this.eventsSubject.next(new OAuthSuccessEvent('user_profile_loaded'));
                    resolve(info);
                },
                err => {
                    this.logger.error('error loading user info', err);
                    this.eventsSubject.next(
                        new OAuthErrorEvent('user_profile_load_error', err)
                    );
                    reject(err);
                }
            );
        });
    }

    /**
     * Uses password flow to exchange userName and password for an access_token.
     * @param userName
     * @param password
     * @param headers Optional additional http-headers.
     */
    public fetchTokenUsingPasswordFlow(
        userName: string,
        password: string,
        headers: HttpHeaders = new HttpHeaders()
    ): Promise<object> {
        if (!this.validateUrlForHttps(this.tokenEndpoint)) {
            throw new Error(
                'tokenEndpoint must use https, or config value for property requireHttps must allow http'
            );
        }

        return new Promise((resolve, reject) => {
            /**
             * A `HttpParameterCodec` that uses `encodeURIComponent` and `decodeURIComponent` to
             * serialize and parse URL parameter keys and values.
             *
             * @stable
             */
            let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() })
                .set('grant_type', 'password')
                .set('scope', this.scope)
                .set('username', userName)
                .set('password', password);

            if (this.useHttpBasicAuth) {
                const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
                headers = headers.set(
                    'Authorization',
                    'Basic ' + header);
            }

            if (!this.useHttpBasicAuth) {
                params = params.set('client_id', this.clientId);
            }

            if (!this.useHttpBasicAuth && this.dummyClientSecret) {
                params = params.set('client_secret', this.dummyClientSecret);
            }

            if (this.customQueryParams) {
                for (const key of Object.getOwnPropertyNames(this.customQueryParams)) {
                    params = params.set(key, this.customQueryParams[key]);
                }
            }

            headers = headers.set(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );

            this.http
                .post<TokenResponse>(this.tokenEndpoint, params, { headers })
                .subscribe(
                    tokenResponse => {
                        this.debug('tokenResponse', tokenResponse);
                        this.storeAccessTokenResponse(
                            tokenResponse.access_token,
                            tokenResponse.refresh_token,
                            tokenResponse.expires_in,
                            tokenResponse.scope
                        );

                        this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                        resolve(tokenResponse);
                    },
                    err => {
                        this.logger.error('Error performing password flow', err);
                        this.eventsSubject.next(new OAuthErrorEvent('token_error', err));
                        reject(err);
                    }
                );
        });
    }

    /**
     * Refreshes the token using a refresh_token.
     * This does not work for implicit flow, b/c
     * there is no refresh_token in this flow.
     * A solution for this is provided by the
     * method silentRefresh.
     */
    public refreshToken(): Promise<object> {

        if (!this.validateUrlForHttps(this.tokenEndpoint)) {
            throw new Error(
                'tokenEndpoint must use https, or config value for property requireHttps must allow http'
            );
        }

        return new Promise((resolve, reject) => {
            let params = new HttpParams()
                .set('grant_type', 'refresh_token')
                .set('client_id', this.clientId)
                .set('scope', this.scope)
                .set('refresh_token', this._storage.getItem('refresh_token'));

            if (this.dummyClientSecret) {
                params = params.set('client_secret', this.dummyClientSecret);
            }

            if (this.customQueryParams) {
                for (const key of Object.getOwnPropertyNames(this.customQueryParams)) {
                    params = params.set(key, this.customQueryParams[key]);
                }
            }

            const headers = new HttpHeaders().set(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );

            this.http
                .post<TokenResponse>(this.tokenEndpoint, params, { headers })
                .pipe(switchMap(tokenResponse => {
                    if (tokenResponse.id_token) {
                        return from(this.processIdToken(tokenResponse.id_token, tokenResponse.access_token, true))
                            .pipe(
                                tap(result => this.storeIdToken(result)),
                                map(_ => tokenResponse)
                            );
                    }
                    else {
                        return of(tokenResponse);
                    }
                }))
                .subscribe(
                    tokenResponse => {
                        this.debug('refresh tokenResponse', tokenResponse);
                        this.storeAccessTokenResponse(
                            tokenResponse.access_token,
                            tokenResponse.refresh_token,
                            tokenResponse.expires_in,
                            tokenResponse.scope
                        );

                        this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                        this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
                        resolve(tokenResponse);
                    },
                    err => {
                        this.logger.error('Error performing password flow', err);
                        this.eventsSubject.next(
                            new OAuthErrorEvent('token_refresh_error', err)
                        );
                        reject(err);
                    }
                );
        });
    }

    protected removeSilentRefreshEventListener(): void {
        if (this.silentRefreshPostMessageEventListener) {
            window.removeEventListener(
                'message',
                this.silentRefreshPostMessageEventListener
            );
            this.silentRefreshPostMessageEventListener = null;
        }
    }

    protected setupSilentRefreshEventListener(): void {
        this.removeSilentRefreshEventListener();

        this.silentRefreshPostMessageEventListener = (e: MessageEvent) => {
            const message = this.processMessageEventMessage(e);

            this.tryLogin({
                customHashFragment: message,
                preventClearHashAfterLogin: true,
                onLoginError: err => {
                    this.eventsSubject.next(
                        new OAuthErrorEvent('silent_refresh_error', err)
                    );
                },
                onTokenReceived: () => {
                    this.eventsSubject.next(new OAuthSuccessEvent('silently_refreshed'));
                }
            }).catch(err => this.debug('tryLogin during silent refresh failed', err));
        };

        window.addEventListener(
            'message',
            this.silentRefreshPostMessageEventListener
        );
    }

    /**
     * Performs a silent refresh for implicit flow.
     * Use this method to get new tokens when/before
     * the existing tokens expire.
     */
    public silentRefresh(params: object = {}, noPrompt = true): Promise<OAuthEvent> {
        const claims: object = this.getIdentityClaims() || {};

        if (this.useIdTokenHintForSilentRefresh && this.hasValidIdToken()) {
            params['id_token_hint'] = this.getIdToken();
        }

        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error(
                'tokenEndpoint must use https, or config value for property requireHttps must allow http'
            );
        }

        if (typeof document === 'undefined') {
            throw new Error('silent refresh is not supported on this platform');
        }

        const existingIframe = document.getElementById(
            this.silentRefreshIFrameName
        );

        if (existingIframe) {
            document.body.removeChild(existingIframe);
        }

        this.silentRefreshSubject = claims['sub'];

        const iframe = document.createElement('iframe');
        iframe.id = this.silentRefreshIFrameName;

        this.setupSilentRefreshEventListener();

        const redirectUri = this.silentRefreshRedirectUri || this.redirectUri;
        this.createLoginUrl(null, null, redirectUri, noPrompt, params).then(url => {
            iframe.setAttribute('src', url);

            if (!this.silentRefreshShowIFrame) {
                iframe.style['display'] = 'none';
            }
            document.body.appendChild(iframe);
        });

        const errors = this.events.pipe(
            filter(e => e instanceof OAuthErrorEvent),
            first()
        );
        const success = this.events.pipe(
            filter(e => e.type === 'silently_refreshed'),
            first()
        );
        const timeout = of(
            new OAuthErrorEvent('silent_refresh_timeout', null)
        ).pipe(delay(this.silentRefreshTimeout));

        return race([errors, success, timeout])
            .pipe(
                tap(e => {
                    if (e.type === 'silent_refresh_timeout') {
                        this.eventsSubject.next(e);
                    }
                }),
                map(e => {
                    if (e instanceof OAuthErrorEvent) {
                        throw e;
                    }
                    return e;
                })
            )
            .toPromise();
    }

    public initImplicitFlowInPopup(options?: { height?: number, width?: number }) {
        options = options || {};
        return this.createLoginUrl(null, null, this.silentRefreshRedirectUri, false, {
            display: 'popup'
        }).then(url => {
            return new Promise((resolve, reject) => {
                let windowRef = window.open(url, '_blank', this.calculatePopupFeatures(options));

                const cleanup = () => {
                    window.removeEventListener('message', listener);
                    windowRef.close();
                    windowRef = null;
                };

                const listener = (e: MessageEvent) => {
                    const message = this.processMessageEventMessage(e);

                    this.tryLogin({
                        customHashFragment: message,
                        preventClearHashAfterLogin: true,
                    }).then(() => {
                        cleanup();
                        resolve();
                    }, err => {
                        cleanup();
                        reject(err);
                    });
                };

                window.addEventListener('message', listener);
            });
        });
    }

    protected calculatePopupFeatures(options: { height?: number, width?: number }) {
        // Specify an static height and width and calculate centered position
        const height = options.height || 470;
        const width = options.width || 500;
        const left = (screen.width / 2) - (width / 2);
        const top = (screen.height / 2) - (height / 2);
        return `location=no,toolbar=no,width=${width},height=${height},top=${top},left=${left}`;
    }

    protected processMessageEventMessage(e: MessageEvent) {
        let expectedPrefix = '#';

        if (this.silentRefreshMessagePrefix) {
            expectedPrefix += this.silentRefreshMessagePrefix;
        }

        if (!e || !e.data || typeof e.data !== 'string') {
            return;
        }

        const prefixedMessage: string = e.data;

        if (!prefixedMessage.startsWith(expectedPrefix)) {
            return;
        }

        return '#' + prefixedMessage.substr(expectedPrefix.length);
    }

    protected canPerformSessionCheck(): boolean {
        if (!this.sessionChecksEnabled) {
            return false;
        }
        if (!this.sessionCheckIFrameUrl) {
            console.warn(
                'sessionChecksEnabled is activated but there is no sessionCheckIFrameUrl'
            );
            return false;
        }
        const sessionState = this.getSessionState();
        if (!sessionState) {
            console.warn(
                'sessionChecksEnabled is activated but there is no session_state'
            );
            return false;
        }
        if (typeof document === 'undefined') {
            return false;
        }

        return true;
    }

    protected setupSessionCheckEventListener(): void {
        this.removeSessionCheckEventListener();

        this.sessionCheckEventListener = (e: MessageEvent) => {
            const origin = e.origin.toLowerCase();
            const issuer = this.issuer.toLowerCase();

            this.debug('sessionCheckEventListener');

            if (!issuer.startsWith(origin)) {
                this.debug(
                    'sessionCheckEventListener',
                    'wrong origin',
                    origin,
                    'expected',
                    issuer
                );
            }

            // only run in Angular zone if it is 'changed' or 'error'
            switch (e.data) {
                case 'unchanged':
                    this.handleSessionUnchanged();
                    break;
                case 'changed':
                    this.ngZone.run(() => {
                        this.handleSessionChange();
                    });
                    break;
                case 'error':
                    this.ngZone.run(() => {
                        this.handleSessionError();
                    });
                    break;
            }

            this.debug('got info from session check inframe', e);
        };

        // prevent Angular from refreshing the view on every message (runs in intervals)
        this.ngZone.runOutsideAngular(() => {
            window.addEventListener('message', this.sessionCheckEventListener);
        });
    }

    protected handleSessionUnchanged(): void {
        this.debug('session check', 'session unchanged');
    }

    protected handleSessionChange(): void {
        /* events: session_changed, relogin, stopTimer, logged_out*/
        this.eventsSubject.next(new OAuthInfoEvent('session_changed'));
        this.stopSessionCheckTimer();
        if (this.silentRefreshRedirectUri) {
            this.silentRefresh().catch(_ =>
                this.debug('silent refresh failed after session changed')
            );
            this.waitForSilentRefreshAfterSessionChange();
        } else {
            this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
            this.logOut(true);
        }
    }

    protected waitForSilentRefreshAfterSessionChange() {
        this.events
            .pipe(
                filter(
                    (e: OAuthEvent) =>
                        e.type === 'silently_refreshed' ||
                        e.type === 'silent_refresh_timeout' ||
                        e.type === 'silent_refresh_error'
                ),
                first()
            )
            .subscribe(e => {
                if (e.type !== 'silently_refreshed') {
                    this.debug('silent refresh did not work after session changed');
                    this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
                    this.logOut(true);
                }
            });
    }

    protected handleSessionError(): void {
        this.stopSessionCheckTimer();
        this.eventsSubject.next(new OAuthInfoEvent('session_error'));
    }

    protected removeSessionCheckEventListener(): void {
        if (this.sessionCheckEventListener) {
            window.removeEventListener('message', this.sessionCheckEventListener);
            this.sessionCheckEventListener = null;
        }
    }

    protected initSessionCheck(): void {
        if (!this.canPerformSessionCheck()) {
            return;
        }

        const existingIframe = document.getElementById(this.sessionCheckIFrameName);
        if (existingIframe) {
            document.body.removeChild(existingIframe);
        }

        const iframe = document.createElement('iframe');
        iframe.id = this.sessionCheckIFrameName;

        this.setupSessionCheckEventListener();

        const url = this.sessionCheckIFrameUrl;
        iframe.setAttribute('src', url);
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        this.startSessionCheckTimer();
    }

    protected startSessionCheckTimer(): void {
        this.stopSessionCheckTimer();
        this.ngZone.runOutsideAngular(() => {
            this.sessionCheckTimer = setInterval(
                this.checkSession.bind(this),
                this.sessionCheckIntervall
            );
        });
    }

    protected stopSessionCheckTimer(): void {
        if (this.sessionCheckTimer) {
            clearInterval(this.sessionCheckTimer);
            this.sessionCheckTimer = null;
        }
    }

    protected checkSession(): void {
        const iframe: any = document.getElementById(this.sessionCheckIFrameName);

        if (!iframe) {
            this.logger.warn(
                'checkSession did not find iframe',
                this.sessionCheckIFrameName
            );
        }

        const sessionState = this.getSessionState();

        if (!sessionState) {
            this.stopSessionCheckTimer();
        }

        const message = this.clientId + ' ' + sessionState;
        iframe.contentWindow.postMessage(message, this.issuer);
    }

    protected async createLoginUrl(
        state = '',
        loginHint = '',
        customRedirectUri = '',
        noPrompt = false,
        params: object = {}
    ) {
        const that = this;

        let redirectUri: string;

        if (customRedirectUri) {
            redirectUri = customRedirectUri;
        } else {
            redirectUri = this.redirectUri;
        }

        const nonce = await this.createAndSaveNonce();

        if (state) {
            state = nonce + this.config.nonceStateSeparator + state;
        } else {
            state = nonce;
        }

        if (!this.requestAccessToken && !this.oidc) {
            throw new Error(
                'Either requestAccessToken or oidc or both must be true'
            );
        }

        if (this.config.responseType) {
            this.responseType = this.config.responseType;
        } else {
            if (this.oidc && this.requestAccessToken) {
                this.responseType = 'id_token token';
            } else if (this.oidc && !this.requestAccessToken) {
                this.responseType = 'id_token';
            } else {
                this.responseType = 'token';
            }
        }

        const seperationChar = that.loginUrl.indexOf('?') > -1 ? '&' : '?';

        let scope = that.scope;

        if (this.oidc && !scope.match(/(^|\s)openid($|\s)/)) {
            scope = 'openid ' + scope;
        }

        let url =
            that.loginUrl +
            seperationChar +
            'response_type=' +
            encodeURIComponent(that.responseType) +
            '&client_id=' +
            encodeURIComponent(that.clientId) +
            '&state=' +
            encodeURIComponent(state) +
            '&redirect_uri=' +
            encodeURIComponent(redirectUri) +
            '&scope=' +
            encodeURIComponent(scope);

        if (this.responseType === 'code' && !this.disablePKCE) {
            const [challenge, verifier] = await this.createChallangeVerifierPairForPKCE();
            this._storage.setItem('PKCI_verifier', verifier);
            url += '&code_challenge=' + challenge;
            url += '&code_challenge_method=S256';
        }

        if (loginHint) {
            url += '&login_hint=' + encodeURIComponent(loginHint);
        }

        if (that.resource) {
            url += '&resource=' + encodeURIComponent(that.resource);
        }

        if (that.oidc) {
            url += '&nonce=' + encodeURIComponent(nonce);
        }

        if (noPrompt) {
            url += '&prompt=none';
        }

        for (const key of Object.keys(params)) {
            url +=
                '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }

        if (this.customQueryParams) {
            for (const key of Object.getOwnPropertyNames(this.customQueryParams)) {
                url +=
                    '&' + key + '=' + encodeURIComponent(this.customQueryParams[key]);
            }
        }

        return url;
        
    }

    initImplicitFlowInternal(
        additionalState = '',
        params: string | object = ''
    ): void {
        if (this.inImplicitFlow) {
            return;
        }

        this.inImplicitFlow = true;

        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error(
                'loginUrl must use https, or config value for property requireHttps must allow http'
            );
        }

        let addParams: object = {};
        let loginHint: string = null;

        if (typeof params === 'string') {
            loginHint = params;
        } else if (typeof params === 'object') {
            addParams = params;
        }

        this.createLoginUrl(additionalState, loginHint, null, false, addParams)
            .then(this.config.openUri)
            .catch(error => {
                console.error('Error in initImplicitFlow', error);
                this.inImplicitFlow = false;
            });
    }

    /**
     * Starts the implicit flow and redirects to user to
     * the auth servers' login url.
     *
     * @param additionalState Optional state that is passed around.
     *  You'll find this state in the property `state` after `tryLogin` logged in the user.
     * @param params Hash with additional parameter. If it is a string, it is used for the
     *               parameter loginHint (for the sake of compatibility with former versions)
     */
    public initImplicitFlow(
        additionalState = '',
        params: string | object = ''
    ): void {
        if (this.loginUrl !== '') {
            this.initImplicitFlowInternal(additionalState, params);
        } else {
            this.events
                .pipe(filter(e => e.type === 'discovery_document_loaded'))
                .subscribe(_ => this.initImplicitFlowInternal(additionalState, params));
        }
    }

    /**
     * Reset current implicit flow
     *
     * @description This method allows resetting the current implict flow in order to be initialized again.
     */
    public resetImplicitFlow(): void {
      this.inImplicitFlow = false;
    }

    protected callOnTokenReceivedIfExists(options: LoginOptions): void {
        const that = this;
        if (options.onTokenReceived) {
            const tokenParams = {
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state
            };
            options.onTokenReceived(tokenParams);
        }
    }

    protected storeAccessTokenResponse(
        accessToken: string,
        refreshToken: string,
        expiresIn: number,
        grantedScopes: String
    ): void {
        this._storage.setItem('access_token', accessToken);
        if (grantedScopes) {
            this._storage.setItem('granted_scopes', JSON.stringify(grantedScopes.split('+')));
        }
        this._storage.setItem('access_token_stored_at', '' + Date.now());
        if (expiresIn) {
            const expiresInMilliSeconds = expiresIn * 1000;
            const now = new Date();
            const expiresAt = now.getTime() + expiresInMilliSeconds;
            this._storage.setItem('expires_at', '' + expiresAt);
        }

        if (refreshToken) {
            this._storage.setItem('refresh_token', refreshToken);
        }
    }

    /**
     * Delegates to tryLoginImplicitFlow for the sake of competability
     * @param options Optional options.
     */
    public tryLogin(options: LoginOptions = null): Promise<boolean> {
        if (this.config.responseType === 'code') {
            return this.tryLoginCodeFlow().then(_ => true);
        }
        else {
            return this.tryLoginImplicitFlow(options);
        }
    }


    private parseQueryString(queryString: string): object {
        if (!queryString || queryString.length === 0) {
            return {};
        }

        if (queryString.charAt(0) === '?') {
            queryString = queryString.substr(1);
        }

        return this.urlHelper.parseQueryString(queryString);


    }

    public tryLoginCodeFlow(): Promise<void> {

        const parts = this.parseQueryString(window.location.search)

        const code = parts['code'];
        const state = parts['state'];

        const href = location.href
                        .replace(/[&\?]code=[^&\$]*/, '')
                        .replace(/[&\?]scope=[^&\$]*/, '')
                        .replace(/[&\?]state=[^&\$]*/, '')
                        .replace(/[&\?]session_state=[^&\$]*/, '');

        history.replaceState(null, window.name, href);

        let [nonceInState, userState] = this.parseState(state);
        this.state = userState;

        if (parts['error']) {
            this.debug('error trying to login');
            this.handleLoginError({}, parts);
            const err = new OAuthErrorEvent('code_error', {}, parts);
            this.eventsSubject.next(err);
            return Promise.reject(err);
        }

        if (!nonceInState) {
            return Promise.resolve();
        }

        const success = this.validateNonce(nonceInState);
        if (!success) {
            const event = new OAuthErrorEvent('invalid_nonce_in_state', null);
            this.eventsSubject.next(event);
            return Promise.reject(event);
        }

        if (code) {
            return new Promise((resolve, reject) => {
                this.getTokenFromCode(code).then(result => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            });
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Get token using an intermediate code. Works for the Authorization Code flow.
     */
    private getTokenFromCode(code: string): Promise<object> {
        let params = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('code', code)
            .set('redirect_uri', this.redirectUri);

        if (!this.disablePKCE) {
            const pkciVerifier = this._storage.getItem('PKCI_verifier');

            if (!pkciVerifier) {
                console.warn('No PKCI verifier found in oauth storage!');
            } else {
                params = params.set('code_verifier', pkciVerifier);
            }
        }

        return this.fetchAndProcessToken(params);
    }

    private fetchAndProcessToken(params: HttpParams): Promise<object> {

        let headers = new HttpHeaders()
                                .set('Content-Type', 'application/x-www-form-urlencoded');

        if (!this.validateUrlForHttps(this.tokenEndpoint)) {
            throw new Error('tokenEndpoint must use Http. Also check property requireHttps.');
        }

        if (this.useHttpBasicAuth) {
            const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
            headers = headers.set(
                'Authorization',
                'Basic ' + header);
        }

        if (!this.useHttpBasicAuth) {
            params = params.set('client_id', this.clientId);
        }

        if (!this.useHttpBasicAuth && this.dummyClientSecret) {
            params = params.set('client_secret', this.dummyClientSecret);
        }

        return new Promise((resolve, reject) => {

            if (this.customQueryParams) {
                for (let key of Object.getOwnPropertyNames(this.customQueryParams)) {
                    params = params.set(key, this.customQueryParams[key]);
                }
            }

            this.http.post<TokenResponse>(this.tokenEndpoint, params, { headers }).subscribe(
                (tokenResponse) => {
                    this.debug('refresh tokenResponse', tokenResponse);
                    this.storeAccessTokenResponse(
                        tokenResponse.access_token, 
                        tokenResponse.refresh_token, 
                        tokenResponse.expires_in,
                        tokenResponse.scope);

                    if (this.oidc && tokenResponse.id_token) {
                        this.processIdToken(tokenResponse.id_token, tokenResponse.access_token).  
                        then(result => {
                            this.storeIdToken(result);
            
                            this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                            this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
            
                            resolve(tokenResponse);
                        })
                        .catch(reason => {
                            this.eventsSubject.next(new OAuthErrorEvent('token_validation_error', reason));
                            console.error('Error validating tokens');
                            console.error(reason);
            
                            reject(reason);
                        });
                    } else {
                        this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                        this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
            
                        resolve(tokenResponse);
                    }
                },
                (err) => {
                    console.error('Error getting token', err);
                    this.eventsSubject.next(new OAuthErrorEvent('token_refresh_error', err));
                    reject(err);
                }
            );
        });
    }

    /**
     * Checks whether there are tokens in the hash fragment
     * as a result of the implicit flow. These tokens are
     * parsed, validated and used to sign the user in to the
     * current client.
     *
     * @param options Optional options.
     */
    public tryLoginImplicitFlow(options: LoginOptions = null): Promise<boolean> {
        options = options || {};

        let parts: object;

        if (options.customHashFragment) {
            parts = this.urlHelper.getHashFragmentParams(options.customHashFragment);
        } else {
            parts = this.urlHelper.getHashFragmentParams();
        }

        this.debug('parsed url', parts);

        const state = parts['state'];

        let [nonceInState, userState] = this.parseState(state);
        this.state = userState;

        if (parts['error']) {
            this.debug('error trying to login');
            this.handleLoginError(options, parts);
            const err = new OAuthErrorEvent('token_error', {}, parts);
            this.eventsSubject.next(err);
            return Promise.reject(err);
        }

        const accessToken = parts['access_token'];
        const idToken = parts['id_token'];
        const sessionState = parts['session_state'];
        const grantedScopes = parts['scope'];

        if (!this.requestAccessToken && !this.oidc) {
            return Promise.reject(
                'Either requestAccessToken or oidc (or both) must be true.'
            );
        }

        if (this.requestAccessToken && !accessToken) {
            return Promise.resolve(false);
        }
        if (this.requestAccessToken && !options.disableOAuth2StateCheck && !state) {
            return Promise.resolve(false);
        }
        if (this.oidc && !idToken) {
            return Promise.resolve(false);
        }

        if (this.sessionChecksEnabled && !sessionState) {
            this.logger.warn(
                'session checks (Session Status Change Notification) ' +
                'were activated in the configuration but the id_token ' +
                'does not contain a session_state claim'
            );
        }

        if (this.requestAccessToken && !options.disableOAuth2StateCheck) {
            const success = this.validateNonce(nonceInState);

            if (!success) {
                const event = new OAuthErrorEvent('invalid_nonce_in_state', null);
                this.eventsSubject.next(event);
                return Promise.reject(event);
            }
        }

        if (this.requestAccessToken) {
            this.storeAccessTokenResponse(
                accessToken,
                null,
                parts['expires_in'] || this.fallbackAccessTokenExpirationTimeInSec,
                grantedScopes
            );
        }

        if (!this.oidc) {
            this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
            if (this.clearHashAfterLogin && !options.preventClearHashAfterLogin) {
                location.hash = '';
            }

            this.callOnTokenReceivedIfExists(options);
            return Promise.resolve(true);

        }

        return this.processIdToken(idToken, accessToken)
            .then(result => {
                if (options.validationHandler) {
                    return options
                        .validationHandler({
                            accessToken: accessToken,
                            idClaims: result.idTokenClaims,
                            idToken: result.idToken,
                            state: state
                        })
                        .then(_ => result);
                }
                return result;
            })
            .then(result => {
                this.storeIdToken(result);
                this.storeSessionState(sessionState);
                if (this.clearHashAfterLogin) {
                    location.hash = '';
                }
                this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                this.callOnTokenReceivedIfExists(options);
                this.inImplicitFlow = false;
                return true;
            })
            .catch(reason => {
                this.eventsSubject.next(
                    new OAuthErrorEvent('token_validation_error', reason)
                );
                this.logger.error('Error validating tokens');
                this.logger.error(reason);
                return Promise.reject(reason);
            });
    }

    private parseState(state: string): [string, string] {
        let nonce = state;
        let userState = '';

        if (state) {
            const idx = state.indexOf(this.config.nonceStateSeparator);
            if (idx > -1) {
                nonce = state.substr(0, idx);
                userState = state.substr(idx + this.config.nonceStateSeparator.length);
            }
        }
        return [nonce, userState];
    }

    protected validateNonce(
        nonceInState: string
    ): boolean {
        const savedNonce = this._storage.getItem('nonce');
        if (savedNonce !== nonceInState) {
            
            const err = 'Validating access_token failed, wrong state/nonce.';
            console.error(err, savedNonce, nonceInState);
            return false;
        }
        return true;
    }

    protected storeIdToken(idToken: ParsedIdToken) {
        this._storage.setItem('id_token', idToken.idToken);
        this._storage.setItem('id_token_claims_obj', idToken.idTokenClaimsJson);
        this._storage.setItem('id_token_expires_at', '' + idToken.idTokenExpiresAt);
        this._storage.setItem('id_token_stored_at', '' + Date.now());
    }

    protected storeSessionState(sessionState: string): void {
        this._storage.setItem('session_state', sessionState);
    }

    protected getSessionState(): string {
        return this._storage.getItem('session_state');
    }

    protected handleLoginError(options: LoginOptions, parts: object): void {
        if (options.onLoginError) {
            options.onLoginError(parts);
        }
        if (this.clearHashAfterLogin) {
            location.hash = '';
        }
    }

    /**
     * @ignore
     */
    public processIdToken(
        idToken: string,
        accessToken: string,
        skipNonceCheck = false
    ): Promise<ParsedIdToken> {
        const tokenParts = idToken.split('.');
        const headerBase64 = this.padBase64(tokenParts[0]);
        const headerJson = b64DecodeUnicode(headerBase64);
        const header = JSON.parse(headerJson);
        const claimsBase64 = this.padBase64(tokenParts[1]);
        const claimsJson = b64DecodeUnicode(claimsBase64);
        const claims = JSON.parse(claimsJson);
        const savedNonce = this._storage.getItem('nonce');

        if (Array.isArray(claims.aud)) {
            if (claims.aud.every(v => v !== this.clientId)) {
                const err = 'Wrong audience: ' + claims.aud.join(',');
                this.logger.warn(err);
                return Promise.reject(err);
            }
        } else {
            if (claims.aud !== this.clientId) {
                const err = 'Wrong audience: ' + claims.aud;
                this.logger.warn(err);
                return Promise.reject(err);
            }
        }

        if (!claims.sub) {
            const err = 'No sub claim in id_token';
            this.logger.warn(err);
            return Promise.reject(err);
        }

        /* For now, we only check whether the sub against
         * silentRefreshSubject when sessionChecksEnabled is on
         * We will reconsider in a later version to do this
         * in every other case too.
         */
        if (
            this.sessionChecksEnabled &&
            this.silentRefreshSubject &&
            this.silentRefreshSubject !== claims['sub']
        ) {
            const err =
                'After refreshing, we got an id_token for another user (sub). ' +
                `Expected sub: ${this.silentRefreshSubject}, received sub: ${
                claims['sub']
                }`;

            this.logger.warn(err);
            return Promise.reject(err);
        }

        if (!claims.iat) {
            const err = 'No iat claim in id_token';
            this.logger.warn(err);
            return Promise.reject(err);
        }

        if (!this.skipIssuerCheck && claims.iss !== this.issuer) {
            const err = 'Wrong issuer: ' + claims.iss;
            this.logger.warn(err);
            return Promise.reject(err);
        }

        if (!skipNonceCheck && claims.nonce !== savedNonce) {
            const err = 'Wrong nonce: ' + claims.nonce;
            this.logger.warn(err);
            return Promise.reject(err);
        }

        if (
            !this.disableAtHashCheck &&
            this.requestAccessToken &&
            !claims['at_hash']
        ) {
            const err = 'An at_hash is needed!';
            this.logger.warn(err);
            return Promise.reject(err);
        }

        const now = Date.now();
        const issuedAtMSec = claims.iat * 1000;
        const expiresAtMSec = claims.exp * 1000;
        const clockSkewInMSec = (this.clockSkewInSec || 600) * 1000;

        if (
            issuedAtMSec - clockSkewInMSec >= now ||
            expiresAtMSec + clockSkewInMSec <= now
        ) {
            const err = 'Token has expired';
            console.error(err);
            console.error({
                now: now,
                issuedAtMSec: issuedAtMSec,
                expiresAtMSec: expiresAtMSec
            });
            return Promise.reject(err);
        }

        const validationParams: ValidationParams = {
            accessToken: accessToken,
            idToken: idToken,
            jwks: this.jwks,
            idTokenClaims: claims,
            idTokenHeader: header,
            loadKeys: () => this.loadJwks()
        };


        return this.checkAtHash(validationParams)
          .then(atHashValid => {
            if (
              !this.disableAtHashCheck &&
              this.requestAccessToken &&
              !atHashValid
          ) {
              const err = 'Wrong at_hash';
              this.logger.warn(err);
              return Promise.reject(err);
          }

          return this.checkSignature(validationParams).then(_ => {
              const result: ParsedIdToken = {
                  idToken: idToken,
                  idTokenClaims: claims,
                  idTokenClaimsJson: claimsJson,
                  idTokenHeader: header,
                  idTokenHeaderJson: headerJson,
                  idTokenExpiresAt: expiresAtMSec
              };
              return result;
          });

        });
    }

    /**
     * Returns the received claims about the user.
     */
    public getIdentityClaims(): object {
        const claims = this._storage.getItem('id_token_claims_obj');
        if (!claims) {
            return null;
        }
        return JSON.parse(claims);
    }

    /**
     * Returns the granted scopes from the server.
     */
    public getGrantedScopes(): object {
        const scopes = this._storage.getItem('granted_scopes');
        if (!scopes) {
            return null;
        }
        return JSON.parse(scopes);
    }

    /**
     * Returns the current id_token.
     */
    public getIdToken(): string {
        return this._storage
            ? this._storage.getItem('id_token')
            : null;
    }

    protected padBase64(base64data): string {
        while (base64data.length % 4 !== 0) {
            base64data += '=';
        }
        return base64data;
    }

    /**
     * Returns the current access_token.
     */
    public getAccessToken(): string {
        return this._storage
            ? this._storage.getItem('access_token')
            : null;
    }

    public getRefreshToken(): string {
        return this._storage
            ? this._storage.getItem('refresh_token')
            : null;
    }

    /**
     * Returns the expiration date of the access_token
     * as milliseconds since 1970.
     */
    public getAccessTokenExpiration(): number {
        if (!this._storage.getItem('expires_at')) {
            return null;
        }
        return parseInt(this._storage.getItem('expires_at'), 10);
    }

    protected getAccessTokenStoredAt(): number {
        return parseInt(this._storage.getItem('access_token_stored_at'), 10);
    }

    protected getIdTokenStoredAt(): number {
        return parseInt(this._storage.getItem('id_token_stored_at'), 10);
    }

    /**
     * Returns the expiration date of the id_token
     * as milliseconds since 1970.
     */
    public getIdTokenExpiration(): number {
        if (!this._storage.getItem('id_token_expires_at')) {
            return null;
        }

        return parseInt(this._storage.getItem('id_token_expires_at'), 10);
    }

    /**
     * Checkes, whether there is a valid access_token.
     */
    public hasValidAccessToken(): boolean {
        if (this.getAccessToken()) {
            const expiresAt = this._storage.getItem('expires_at');
            const now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Checks whether there is a valid id_token.
     */
    public hasValidIdToken(): boolean {
        if (this.getIdToken()) {
            const expiresAt = this._storage.getItem('id_token_expires_at');
            const now = new Date();
            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Returns the auth-header that can be used
     * to transmit the access_token to a service
     */
    public authorizationHeader(): string {
        return 'Bearer ' + this.getAccessToken();
    }

    /**
     * Removes all tokens and logs the user out.
     * If a logout url is configured, the user is
     * redirected to it.
     * @param noRedirectToLogoutUrl
     */
    public logOut(noRedirectToLogoutUrl = false): void {
        const id_token = this.getIdToken();
        this._storage.removeItem('access_token');
        this._storage.removeItem('id_token');
        this._storage.removeItem('refresh_token');
        this._storage.removeItem('nonce');
        this._storage.removeItem('expires_at');
        this._storage.removeItem('id_token_claims_obj');
        this._storage.removeItem('id_token_expires_at');
        this._storage.removeItem('id_token_stored_at');
        this._storage.removeItem('access_token_stored_at');
        this._storage.removeItem('granted_scopes');
        this._storage.removeItem('session_state');

        this.silentRefreshSubject = null;

        this.eventsSubject.next(new OAuthInfoEvent('logout'));

        if (!this.logoutUrl) {
            return;
        }
        if (noRedirectToLogoutUrl) {
            return;
        }

        if (!id_token && !this.postLogoutRedirectUri) {
            return;
        }

        let logoutUrl: string;

        if (!this.validateUrlForHttps(this.logoutUrl)) {
            throw new Error(
                'logoutUrl must use https, or config value for property requireHttps must allow http'
            );
        }

        // For backward compatibility
        if (this.logoutUrl.indexOf('{{') > -1) {
            logoutUrl = this.logoutUrl
                .replace(/\{\{id_token\}\}/, id_token)
                .replace(/\{\{client_id\}\}/, this.clientId);
        } else {

            let params = new HttpParams();

            if (id_token) {
                params = params.set('id_token_hint', id_token);
            }

            const postLogoutUrl = this.postLogoutRedirectUri || this.redirectUri;
            if (postLogoutUrl) {
                params = params.set('post_logout_redirect_uri', postLogoutUrl);
            }

            logoutUrl =
                this.logoutUrl +
                (this.logoutUrl.indexOf('?') > -1 ? '&' : '?') +
                params.toString();
        }
        this.config.openUri(logoutUrl);
    }

    /**
     * @ignore
     */
    public createAndSaveNonce(): Promise<string> {
        const that = this;
        return this.createNonce().then(function (nonce: any) {
            that._storage.setItem('nonce', nonce);
            return nonce;
        });
    }

    /**
     * @ignore
     */
    public ngOnDestroy() {
        this.clearAccessTokenTimer();
        this.clearIdTokenTimer();
    }

    protected createNonce(): Promise<string> {
        return new Promise((resolve) => {
            if (this.rngUrl) {
                throw new Error(
                    'createNonce with rng-web-api has not been implemented so far'
                );
            }

            /*
             * This alphabet uses a-z A-Z 0-9 _- symbols.
             * Symbols order was changed for better gzip compression.
             */
            const url = 'Uint8ArdomValuesObj012345679BCDEFGHIJKLMNPQRSTWXYZ_cfghkpqvwxyz-';
            let size = 45;
            let id = '';

            const crypto = self.crypto || self['msCrypto'];
            if (crypto) {
                const bytes = crypto.getRandomValues(new Uint8Array(size));
                while (0 < size--) {
                    id += url[bytes[size] & 63];
                }
            } else {
                while (0 < size--) {
                    id += url[Math.random() * 64 | 0];
                }
            }

            resolve(id);
        });
    }

    protected async checkAtHash(params: ValidationParams): Promise<boolean> {
        if (!this.tokenValidationHandler) {
            this.logger.warn(
                'No tokenValidationHandler configured. Cannot check at_hash.'
            );
            return true;
        }
        return this.tokenValidationHandler.validateAtHash(params);
    }

    protected checkSignature(params: ValidationParams): Promise<any> {
        if (!this.tokenValidationHandler) {
            this.logger.warn(
                'No tokenValidationHandler configured. Cannot check signature.'
            );
            return Promise.resolve(null);
        }
        return this.tokenValidationHandler.validateSignature(params);
    }


    /**
     * Start the implicit flow or the code flow,
     * depending on your configuration.
     */
    public initLoginFlow(
        additionalState = '',
        params = {}
    ) {
        if (this.responseType === 'code') {
            return this.initCodeFlow(additionalState, params);
        } else {
            return this.initImplicitFlow(additionalState, params);
        }
    }

    /**
     * Starts the authorization code flow and redirects to user to
     * the auth servers login url.
     */
    public initCodeFlow(
        additionalState = '',
        params = {}
    ): void {
        if (this.loginUrl !== '') {
            this.initCodeFlowInternal(additionalState, params);
        } else {
            this.events.pipe(filter(e => e.type === 'discovery_document_loaded'))
            .subscribe(_ => this.initCodeFlowInternal(additionalState, params));
        }
    }

    private initCodeFlowInternal(
        additionalState = '',
        params = {}
    ): void {

        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error('loginUrl must use Http. Also check property requireHttps.');
        }

        this.createLoginUrl(additionalState, '', null, false, params).then(function (url) {
            location.href = url;
        })
        .catch(error => {
            console.error('Error in initAuthorizationCodeFlow');
            console.error(error);
        });
    }

    protected async createChallangeVerifierPairForPKCE(): Promise<[string, string]> {

        if (!this.crypto) {
            throw new Error('PKCI support for code flow needs a CryptoHander. Did you import the OAuthModule using forRoot() ?');
        }


        const verifier = await this.createNonce();
        const challengeRaw = await this.crypto.calcHash(verifier, 'sha-256');
        const challange = base64UrlEncode(challengeRaw);

        return [challange, verifier];
    }
}
