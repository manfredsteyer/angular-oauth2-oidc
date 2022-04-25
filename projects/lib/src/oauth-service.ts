import { Injectable, NgZone, Optional, OnDestroy, Inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Observable,
  Subject,
  Subscription,
  of,
  race,
  from,
  combineLatest,
  throwError,
} from 'rxjs';
import {
  filter,
  delay,
  first,
  tap,
  map,
  switchMap,
  debounceTime,
  catchError,
} from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { DateTimeProvider } from './date-time-provider';

import {
  ValidationHandler,
  ValidationParams,
} from './token-validation/validation-handler';
import { UrlHelperService } from './url-helper.service';
import {
  OAuthEvent,
  OAuthInfoEvent,
  OAuthErrorEvent,
  OAuthSuccessEvent,
} from './events';
import {
  OAuthLogger,
  OAuthStorage,
  LoginOptions,
  ParsedIdToken,
  OidcDiscoveryDoc,
  TokenResponse,
  UserInfo,
} from './types';
import { b64DecodeUnicode, base64UrlEncode } from './base64-helper';
import { AuthConfig } from './auth.config';
import { WebHttpUrlEncodingCodec } from './encoder';
import { HashHandler } from './token-validation/hash-handler';

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
  public discoveryDocumentLoaded$: Observable<OidcDiscoveryDoc>;

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
  protected discoveryDocumentLoadedSubject: Subject<OidcDiscoveryDoc> =
    new Subject<OidcDiscoveryDoc>();
  protected silentRefreshPostMessageEventListener: EventListener;
  protected grantTypesSupported: Array<string> = [];
  protected _storage: OAuthStorage;
  protected accessTokenTimeoutSubscription: Subscription;
  protected idTokenTimeoutSubscription: Subscription;
  protected tokenReceivedSubscription: Subscription;
  protected automaticRefreshSubscription: Subscription;
  protected sessionCheckEventListener: EventListener;
  protected jwksUri: string;
  protected sessionCheckTimer: any;
  protected silentRefreshSubject: string;
  protected inImplicitFlow = false;

  protected saveNoncesInLocalStorage = false;
  private document: Document;

  constructor(
    protected ngZone: NgZone,
    protected http: HttpClient,
    @Optional() storage: OAuthStorage,
    @Optional() tokenValidationHandler: ValidationHandler,
    @Optional() protected config: AuthConfig,
    protected urlHelper: UrlHelperService,
    protected logger: OAuthLogger,
    @Optional() protected crypto: HashHandler,
    @Inject(DOCUMENT) document: any,
    protected dateTimeService: DateTimeProvider
  ) {
    super();

    this.debug('angular-oauth2-oidc v10');

    // See https://github.com/manfredsteyer/angular-oauth2-oidc/issues/773 for why this is needed
    this.document = document;

    if (!config) {
      config = {};
    }

    this.discoveryDocumentLoaded$ =
      this.discoveryDocumentLoadedSubject.asObservable();
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
        'No OAuthStorage provided and cannot access default (sessionStorage).' +
          'Consider providing a custom OAuthStorage implementation in your module.',
        e
      );
    }

    // in IE, sessionStorage does not always survive a redirect
    if (this.checkLocalStorageAccessable()) {
      const ua = window?.navigator?.userAgent;
      const msie = ua?.includes('MSIE ') || ua?.includes('Trident');

      if (msie) {
        this.saveNoncesInLocalStorage = true;
      }
    }

    this.setupRefreshTimer();
  }

  private checkLocalStorageAccessable() {
    if (typeof window === 'undefined') return false;

    const test = 'test';
    try {
      if (typeof window['localStorage'] === 'undefined') return false;

      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Use this method to configure the service
   * @param config the configuration
   */
  public configure(config: AuthConfig): void {
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

  protected setupSessionCheck(): void {
    this.events
      .pipe(filter((e) => e.type === 'token_received'))
      .subscribe((e) => {
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
  public setupAutomaticSilentRefresh(
    params: object = {},
    listenTo?: 'access_token' | 'id_token' | 'any',
    noPrompt = true
  ): void {
    let shouldRunSilentRefresh = true;
    this.clearAutomaticRefreshTimer();
    this.automaticRefreshSubscription = this.events
      .pipe(
        tap((e) => {
          if (e.type === 'token_received') {
            shouldRunSilentRefresh = true;
          } else if (e.type === 'logout') {
            shouldRunSilentRefresh = false;
          }
        }),
        filter(
          (e: OAuthInfoEvent) =>
            e.type === 'token_expires' &&
            (listenTo == null || listenTo === 'any' || e.info === listenTo)
        ),
        debounceTime(1000)
      )
      .subscribe((_) => {
        if (shouldRunSilentRefresh) {
          // this.silentRefresh(params, noPrompt).catch(_ => {
          this.refreshInternal(params, noPrompt).catch((_) => {
            this.debug('Automatic silent refresh did not work');
          });
        }
      });

    this.restartRefreshTimerIfStillLoggedIn();
  }

  protected refreshInternal(
    params,
    noPrompt
  ): Promise<TokenResponse | OAuthEvent> {
    if (!this.useSilentRefresh && this.responseType === 'code') {
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
  public loadDiscoveryDocumentAndTryLogin(
    options: LoginOptions = null
  ): Promise<boolean> {
    return this.loadDiscoveryDocument().then((doc) => {
      return this.tryLogin(options);
    });
  }

  /**
   * Convenience method that first calls `loadDiscoveryDocumentAndTryLogin(...)`
   * and if then chains to `initLoginFlow()`, but only if there is no valid
   * IdToken or no valid AccessToken.
   *
   * @param options LoginOptions to pass through to `tryLogin(...)`
   */
  public loadDiscoveryDocumentAndLogin(
    options: LoginOptions & { state?: string } = null
  ): Promise<boolean> {
    options = options || {};
    return this.loadDiscoveryDocumentAndTryLogin(options).then((_) => {
      if (!this.hasValidIdToken() || !this.hasValidAccessToken()) {
        const state = typeof options.state === 'string' ? options.state : '';
        this.initLoginFlow(state);
        return false;
      } else {
        return true;
      }
    });
  }

  protected debug(...args): void {
    if (this.showDebugInformation) {
      this.logger.debug.apply(this.logger, args);
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

  protected assertUrlNotNullAndCorrectProtocol(
    url: string | undefined,
    description: string
  ) {
    if (!url) {
      throw new Error(`'${description}' should not be null`);
    }
    if (!this.validateUrlForHttps(url)) {
      throw new Error(
        `'${description}' must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS).`
      );
    }
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

    if (this.hasValidIdToken() || this.hasValidAccessToken()) {
      this.clearAccessTokenTimer();
      this.clearIdTokenTimer();
      this.setupExpirationTimers();
    }

    if (this.tokenReceivedSubscription)
      this.tokenReceivedSubscription.unsubscribe();

    this.tokenReceivedSubscription = this.events
      .pipe(filter((e) => e.type === 'token_received'))
      .subscribe((_) => {
        this.clearAccessTokenTimer();
        this.clearIdTokenTimer();
        this.setupExpirationTimers();
      });
  }

  protected setupExpirationTimers(): void {
    if (this.hasValidAccessToken()) {
      this.setupAccessTokenTimer();
    }

    if (this.hasValidIdToken()) {
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
        .subscribe((e) => {
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
        .subscribe((e) => {
          this.ngZone.run(() => {
            this.eventsSubject.next(e);
          });
        });
    });
  }

  /**
   * Stops timers for automatic refresh.
   * To restart it, call setupAutomaticSilentRefresh again.
   */
  public stopAutomaticRefresh() {
    this.clearAccessTokenTimer();
    this.clearIdTokenTimer();
    this.clearAutomaticRefreshTimer();
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

  protected clearAutomaticRefreshTimer(): void {
    if (this.automaticRefreshSubscription) {
      this.automaticRefreshSubscription.unsubscribe();
    }
  }

  protected calcTimeout(storedAt: number, expiration: number): number {
    const now = this.dateTimeService.now();
    const delta =
      (expiration - storedAt) * this.timeoutFactor - (now - storedAt);
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
  public loadDiscoveryDocument(
    fullUrl: string = null
  ): Promise<OAuthSuccessEvent> {
    return new Promise((resolve, reject) => {
      if (!fullUrl) {
        fullUrl = this.issuer || '';
        if (!fullUrl.endsWith('/')) {
          fullUrl += '/';
        }
        fullUrl += '.well-known/openid-configuration';
      }

      if (!this.validateUrlForHttps(fullUrl)) {
        reject(
          "issuer  must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
        );
        return;
      }

      this.http.get<OidcDiscoveryDoc>(fullUrl).subscribe(
        (doc) => {
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
          this.userinfoEndpoint =
            doc.userinfo_endpoint || this.userinfoEndpoint;
          this.jwksUri = doc.jwks_uri;
          this.sessionCheckIFrameUrl =
            doc.check_session_iframe || this.sessionCheckIFrameUrl;

          this.discoveryDocumentLoaded = true;
          this.discoveryDocumentLoadedSubject.next(doc);
          this.revocationEndpoint =
            doc.revocation_endpoint || this.revocationEndpoint;

          if (this.sessionChecksEnabled) {
            this.restartSessionChecksIfStillLoggedIn();
          }

          this.loadJwks()
            .then((jwks) => {
              const result: object = {
                discoveryDocument: doc,
                jwks: jwks,
              };

              const event = new OAuthSuccessEvent(
                'discovery_document_loaded',
                result
              );
              this.eventsSubject.next(event);
              resolve(event);
              return;
            })
            .catch((err) => {
              this.eventsSubject.next(
                new OAuthErrorEvent('discovery_document_load_error', err)
              );
              reject(err);
              return;
            });
        },
        (err) => {
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
          (jwks) => {
            this.jwks = jwks;
            this.eventsSubject.next(
              new OAuthSuccessEvent('discovery_document_loaded')
            );
            resolve(jwks);
          },
          (err) => {
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

    errors = this.validateUrlFromDiscoveryDocument(doc.revocation_endpoint);
    if (errors.length > 0) {
      this.logger.error(
        'error validating revocation_endpoint in discovery document',
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
      this.logger.error(
        'error validating jwks_uri in discovery document',
        errors
      );
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
        "userinfoEndpoint must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
      );
    }

    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders().set(
        'Authorization',
        'Bearer ' + this.getAccessToken()
      );

      this.http
        .get(this.userinfoEndpoint, {
          headers,
          observe: 'response',
          responseType: 'text',
        })
        .subscribe(
          (response) => {
            this.debug('userinfo received', JSON.stringify(response));
            if (
              response.headers
                .get('content-type')
                .startsWith('application/json')
            ) {
              let info = JSON.parse(response.body);
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

              this._storage.setItem(
                'id_token_claims_obj',
                JSON.stringify(info)
              );
              this.eventsSubject.next(
                new OAuthSuccessEvent('user_profile_loaded')
              );
              resolve({ info });
            } else {
              this.debug('userinfo is not JSON, treating it as JWE/JWS');
              this.eventsSubject.next(
                new OAuthSuccessEvent('user_profile_loaded')
              );
              resolve(JSON.parse(response.body));
            }
          },
          (err) => {
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
  ): Promise<TokenResponse> {
    const parameters = {
      username: userName,
      password: password,
    };
    return this.fetchTokenUsingGrant('password', parameters, headers);
  }

  /**
   * Uses a custom grant type to retrieve tokens.
   * @param grantType Grant type.
   * @param parameters Parameters to pass.
   * @param headers Optional additional HTTP headers.
   */
  public fetchTokenUsingGrant(
    grantType: string,
    parameters: object,
    headers: HttpHeaders = new HttpHeaders()
  ): Promise<TokenResponse> {
    this.assertUrlNotNullAndCorrectProtocol(
      this.tokenEndpoint,
      'tokenEndpoint'
    );

    /**
     * A `HttpParameterCodec` that uses `encodeURIComponent` and `decodeURIComponent` to
     * serialize and parse URL parameter keys and values.
     *
     * @stable
     */
    let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() })
      .set('grant_type', grantType)
      .set('scope', this.scope);

    if (this.useHttpBasicAuth) {
      const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
      headers = headers.set('Authorization', 'Basic ' + header);
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

    // set explicit parameters last, to allow overwriting
    for (const key of Object.keys(parameters)) {
      params = params.set(key, parameters[key]);
    }

    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return new Promise((resolve, reject) => {
      this.http
        .post<TokenResponse>(this.tokenEndpoint, params, { headers })
        .subscribe(
          (tokenResponse) => {
            this.debug('tokenResponse', tokenResponse);
            this.storeAccessTokenResponse(
              tokenResponse.access_token,
              tokenResponse.refresh_token,
              tokenResponse.expires_in ||
                this.fallbackAccessTokenExpirationTimeInSec,
              tokenResponse.scope,
              this.extractRecognizedCustomParameters(tokenResponse)
            );
            if (this.oidc && tokenResponse.id_token) {
              this.processIdToken(
                tokenResponse.id_token,
                tokenResponse.access_token
              ).then((result) => {
                this.storeIdToken(result);
                resolve(tokenResponse);
              });
            }
            this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
            resolve(tokenResponse);
          },
          (err) => {
            this.logger.error('Error performing ${grantType} flow', err);
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
  public refreshToken(): Promise<TokenResponse> {
    this.assertUrlNotNullAndCorrectProtocol(
      this.tokenEndpoint,
      'tokenEndpoint'
    );
    return new Promise((resolve, reject) => {
      let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() })
        .set('grant_type', 'refresh_token')
        .set('scope', this.scope)
        .set('refresh_token', this._storage.getItem('refresh_token'));

      let headers = new HttpHeaders().set(
        'Content-Type',
        'application/x-www-form-urlencoded'
      );

      if (this.useHttpBasicAuth) {
        const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
        headers = headers.set('Authorization', 'Basic ' + header);
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

      this.http
        .post<TokenResponse>(this.tokenEndpoint, params, { headers })
        .pipe(
          switchMap((tokenResponse) => {
            if (tokenResponse.id_token) {
              return from(
                this.processIdToken(
                  tokenResponse.id_token,
                  tokenResponse.access_token,
                  true
                )
              ).pipe(
                tap((result) => this.storeIdToken(result)),
                map((_) => tokenResponse)
              );
            } else {
              return of(tokenResponse);
            }
          })
        )
        .subscribe(
          (tokenResponse) => {
            this.debug('refresh tokenResponse', tokenResponse);
            this.storeAccessTokenResponse(
              tokenResponse.access_token,
              tokenResponse.refresh_token,
              tokenResponse.expires_in ||
                this.fallbackAccessTokenExpirationTimeInSec,
              tokenResponse.scope,
              this.extractRecognizedCustomParameters(tokenResponse)
            );

            this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
            this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
            resolve(tokenResponse);
          },
          (err) => {
            this.logger.error('Error refreshing token', err);
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
        customRedirectUri: this.silentRefreshRedirectUri || this.redirectUri,
      }).catch((err) =>
        this.debug('tryLogin during silent refresh failed', err)
      );
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
  public silentRefresh(
    params: object = {},
    noPrompt = true
  ): Promise<OAuthEvent> {
    const claims: object = this.getIdentityClaims() || {};

    if (this.useIdTokenHintForSilentRefresh && this.hasValidIdToken()) {
      params['id_token_hint'] = this.getIdToken();
    }

    if (!this.validateUrlForHttps(this.loginUrl)) {
      throw new Error(
        "loginUrl  must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
      );
    }

    if (typeof this.document === 'undefined') {
      throw new Error('silent refresh is not supported on this platform');
    }

    const existingIframe = this.document.getElementById(
      this.silentRefreshIFrameName
    );

    if (existingIframe) {
      this.document.body.removeChild(existingIframe);
    }

    this.silentRefreshSubject = claims['sub'];

    const iframe = this.document.createElement('iframe');
    iframe.id = this.silentRefreshIFrameName;

    this.setupSilentRefreshEventListener();

    const redirectUri = this.silentRefreshRedirectUri || this.redirectUri;
    this.createLoginUrl(null, null, redirectUri, noPrompt, params).then(
      (url) => {
        iframe.setAttribute('src', url);

        if (!this.silentRefreshShowIFrame) {
          iframe.style['display'] = 'none';
        }
        this.document.body.appendChild(iframe);
      }
    );

    const errors = this.events.pipe(
      filter((e) => e instanceof OAuthErrorEvent),
      first()
    );
    const success = this.events.pipe(
      filter((e) => e.type === 'token_received'),
      first()
    );
    const timeout = of(
      new OAuthErrorEvent('silent_refresh_timeout', null)
    ).pipe(delay(this.silentRefreshTimeout));

    return race([errors, success, timeout])
      .pipe(
        map((e) => {
          if (e instanceof OAuthErrorEvent) {
            if (e.type === 'silent_refresh_timeout') {
              this.eventsSubject.next(e);
            } else {
              e = new OAuthErrorEvent('silent_refresh_error', e);
              this.eventsSubject.next(e);
            }
            throw e;
          } else if (e.type === 'token_received') {
            e = new OAuthSuccessEvent('silently_refreshed');
            this.eventsSubject.next(e);
          }
          return e;
        })
      )
      .toPromise();
  }

  /**
   * This method exists for backwards compatibility.
   * {@link OAuthService#initLoginFlowInPopup} handles both code
   * and implicit flows.
   */
  public initImplicitFlowInPopup(options?: {
    height?: number;
    width?: number;
    windowRef?: Window;
  }) {
    return this.initLoginFlowInPopup(options);
  }

  public initLoginFlowInPopup(options?: {
    height?: number;
    width?: number;
    windowRef?: Window;
  }) {
    options = options || {};
    return this.createLoginUrl(
      null,
      null,
      this.silentRefreshRedirectUri,
      false,
      {
        display: 'popup',
      }
    ).then((url) => {
      return new Promise((resolve, reject) => {
        /**
         * Error handling section
         */
        const checkForPopupClosedInterval = 500;

        let windowRef = null;
        // If we got no window reference we open a window
        // else we are using the window already opened
        if (!options.windowRef) {
          windowRef = window.open(
            url,
            'ngx-oauth2-oidc-login',
            this.calculatePopupFeatures(options)
          );
        } else if (options.windowRef && !options.windowRef.closed) {
          windowRef = options.windowRef;
          windowRef.location.href = url;
        }

        let checkForPopupClosedTimer: any;

        const tryLogin = (hash: string) => {
          this.tryLogin({
            customHashFragment: hash,
            preventClearHashAfterLogin: true,
            customRedirectUri: this.silentRefreshRedirectUri,
          }).then(
            () => {
              cleanup();
              resolve(true);
            },
            (err) => {
              cleanup();
              reject(err);
            }
          );
        };

        const checkForPopupClosed = () => {
          if (!windowRef || windowRef.closed) {
            cleanup();
            reject(new OAuthErrorEvent('popup_closed', {}));
          }
        };
        if (!windowRef) {
          reject(new OAuthErrorEvent('popup_blocked', {}));
        } else {
          checkForPopupClosedTimer = window.setInterval(
            checkForPopupClosed,
            checkForPopupClosedInterval
          );
        }

        const cleanup = () => {
          window.clearInterval(checkForPopupClosedTimer);
          window.removeEventListener('storage', storageListener);
          window.removeEventListener('message', listener);
          if (windowRef !== null) {
            windowRef.close();
          }
          windowRef = null;
        };

        const listener = (e: MessageEvent) => {
          const message = this.processMessageEventMessage(e);

          if (message && message !== null) {
            window.removeEventListener('storage', storageListener);
            tryLogin(message);
          } else {
            console.log('false event firing');
          }
        };

        const storageListener = (event: StorageEvent) => {
          if (event.key === 'auth_hash') {
            window.removeEventListener('message', listener);
            tryLogin(event.newValue);
          }
        };

        window.addEventListener('message', listener);
        window.addEventListener('storage', storageListener);
      });
    });
  }

  protected calculatePopupFeatures(options: {
    height?: number;
    width?: number;
  }): string {
    // Specify an static height and width and calculate centered position

    const height = options.height || 470;
    const width = options.width || 500;
    const left = window.screenLeft + (window.outerWidth - width) / 2;
    const top = window.screenTop + (window.outerHeight - height) / 2;
    return `location=no,toolbar=no,width=${width},height=${height},top=${top},left=${left}`;
  }

  protected processMessageEventMessage(e: MessageEvent): string {
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
    if (typeof this.document === 'undefined') {
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
          issuer,
          'event',
          e
        );

        return;
      }

      // only run in Angular zone if it is 'changed' or 'error'
      switch (e.data) {
        case 'unchanged':
          this.ngZone.run(() => {
            this.handleSessionUnchanged();
          });
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
    this.eventsSubject.next(new OAuthInfoEvent('session_unchanged'));
  }

  protected handleSessionChange(): void {
    this.eventsSubject.next(new OAuthInfoEvent('session_changed'));
    this.stopSessionCheckTimer();

    if (!this.useSilentRefresh && this.responseType === 'code') {
      this.refreshToken()
        .then((_) => {
          this.debug('token refresh after session change worked');
        })
        .catch((_) => {
          this.debug('token refresh did not work after session changed');
          this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
          this.logOut(true);
        });
    } else if (this.silentRefreshRedirectUri) {
      this.silentRefresh().catch((_) =>
        this.debug('silent refresh failed after session changed')
      );
      this.waitForSilentRefreshAfterSessionChange();
    } else {
      this.eventsSubject.next(new OAuthInfoEvent('session_terminated'));
      this.logOut(true);
    }
  }

  protected waitForSilentRefreshAfterSessionChange(): void {
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
      .subscribe((e) => {
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

    const existingIframe = this.document.getElementById(
      this.sessionCheckIFrameName
    );
    if (existingIframe) {
      this.document.body.removeChild(existingIframe);
    }

    const iframe = this.document.createElement('iframe');
    iframe.id = this.sessionCheckIFrameName;

    this.setupSessionCheckEventListener();

    const url = this.sessionCheckIFrameUrl;
    iframe.setAttribute('src', url);
    iframe.style.display = 'none';
    this.document.body.appendChild(iframe);

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

  public checkSession(): void {
    const iframe: any = this.document.getElementById(
      this.sessionCheckIFrameName
    );

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
  ): Promise<string> {
    const that = this;

    let redirectUri: string;

    if (customRedirectUri) {
      redirectUri = customRedirectUri;
    } else {
      redirectUri = this.redirectUri;
    }

    const nonce = await this.createAndSaveNonce();

    if (state) {
      state =
        nonce + this.config.nonceStateSeparator + encodeURIComponent(state);
    } else {
      state = nonce;
    }

    if (!this.requestAccessToken && !this.oidc) {
      throw new Error('Either requestAccessToken or oidc or both must be true');
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

    if (this.responseType.includes('code') && !this.disablePKCE) {
      const [challenge, verifier] =
        await this.createChallangeVerifierPairForPKCE();

      if (
        this.saveNoncesInLocalStorage &&
        typeof window['localStorage'] !== 'undefined'
      ) {
        localStorage.setItem('PKCE_verifier', verifier);
      } else {
        this._storage.setItem('PKCE_verifier', verifier);
      }

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
        "loginUrl  must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
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
      .catch((error) => {
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
        .pipe(filter((e) => e.type === 'discovery_document_loaded'))
        .subscribe((_) =>
          this.initImplicitFlowInternal(additionalState, params)
        );
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
        state: that.state,
      };
      options.onTokenReceived(tokenParams);
    }
  }

  protected storeAccessTokenResponse(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    grantedScopes: String,
    customParameters?: Map<string, string>
  ): void {
    this._storage.setItem('access_token', accessToken);
    if (grantedScopes && !Array.isArray(grantedScopes)) {
      this._storage.setItem(
        'granted_scopes',
        JSON.stringify(grantedScopes.split(' '))
      );
    } else if (grantedScopes && Array.isArray(grantedScopes)) {
      this._storage.setItem('granted_scopes', JSON.stringify(grantedScopes));
    }

    this._storage.setItem(
      'access_token_stored_at',
      '' + this.dateTimeService.now()
    );
    if (expiresIn) {
      const expiresInMilliSeconds = expiresIn * 1000;
      const now = this.dateTimeService.new();
      const expiresAt = now.getTime() + expiresInMilliSeconds;
      this._storage.setItem('expires_at', '' + expiresAt);
    }

    if (refreshToken) {
      this._storage.setItem('refresh_token', refreshToken);
    }
    if (customParameters) {
      customParameters.forEach((value: string, key: string) => {
        this._storage.setItem(key, value);
      });
    }
  }

  /**
   * Delegates to tryLoginImplicitFlow for the sake of competability
   * @param options Optional options.
   */
  public tryLogin(options: LoginOptions = null): Promise<boolean> {
    if (this.config.responseType === 'code') {
      return this.tryLoginCodeFlow(options).then((_) => true);
    } else {
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

  public async tryLoginCodeFlow(options: LoginOptions = null): Promise<void> {
    options = options || {};

    const querySource = options.customHashFragment
      ? options.customHashFragment.substring(1)
      : window.location.search;

    const parts = this.getCodePartsFromUrl(querySource);

    const code = parts['code'];
    const state = parts['state'];

    const sessionState = parts['session_state'];

    if (!options.preventClearHashAfterLogin) {
      const href =
        location.origin +
        location.pathname +
        location.search
          .replace(/[&?]code=[^&\$]*/, '')
          .replace(/[&?]scope=[^&\$]*/, '')
          .replace(/[&?]state=[^&\$]*/, '')
          .replace(/[&?]session_state=[^&\$]*/, '')
          .replace(/^&/, '?') +
        location.hash;

      history.replaceState(null, window.name, href);
    }

    let [nonceInState, userState] = this.parseState(state);
    this.state = userState;

    if (parts['error']) {
      this.debug('error trying to login');
      this.handleLoginError(options, parts);
      const err = new OAuthErrorEvent('code_error', {}, parts);
      this.eventsSubject.next(err);
      return Promise.reject(err);
    }

    if (!options.disableNonceCheck) {
      if (!nonceInState) {
        this.saveRequestedRoute();
        return Promise.resolve();
      }

      if (!options.disableOAuth2StateCheck) {
        const success = this.validateNonce(nonceInState);
        if (!success) {
          const event = new OAuthErrorEvent('invalid_nonce_in_state', null);
          this.eventsSubject.next(event);
          return Promise.reject(event);
        }
      }

      this.storeSessionState(sessionState);

      if (code) {
        await this.getTokenFromCode(code, options);
        this.restoreRequestedRoute();
        return Promise.resolve();
      } else {
        return Promise.resolve();
      }
    }

    return Promise.reject();
  }

  private saveRequestedRoute() {
    if (this.config.preserveRequestedRoute) {
      this._storage.setItem(
        'requested_route',
        window.location.pathname + window.location.search
      );
    }
  }

  private restoreRequestedRoute() {
    const requestedRoute = this._storage.getItem('requested_route');
    if (requestedRoute) {
      history.replaceState(null, '', window.location.origin + requestedRoute);
    }
  }

  /**
   * Retrieve the returned auth code from the redirect uri that has been called.
   * If required also check hash, as we could use hash location strategy.
   */
  private getCodePartsFromUrl(queryString: string): object {
    if (!queryString || queryString.length === 0) {
      return this.urlHelper.getHashFragmentParams();
    }

    // normalize query string
    if (queryString.charAt(0) === '?') {
      queryString = queryString.substr(1);
    }

    return this.urlHelper.parseQueryString(queryString);
  }

  /**
   * Get token using an intermediate code. Works for the Authorization Code flow.
   */
  private getTokenFromCode(
    code: string,
    options: LoginOptions
  ): Promise<object> {
    let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() })
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', options.customRedirectUri || this.redirectUri);

    if (!this.disablePKCE) {
      let PKCEVerifier;

      if (
        this.saveNoncesInLocalStorage &&
        typeof window['localStorage'] !== 'undefined'
      ) {
        PKCEVerifier = localStorage.getItem('PKCE_verifier');
      } else {
        PKCEVerifier = this._storage.getItem('PKCE_verifier');
      }

      if (!PKCEVerifier) {
        console.warn('No PKCE verifier found in oauth storage!');
      } else {
        params = params.set('code_verifier', PKCEVerifier);
      }
    }

    return this.fetchAndProcessToken(params, options);
  }

  private fetchAndProcessToken(
    params: HttpParams,
    options: LoginOptions
  ): Promise<TokenResponse> {
    options = options || {};

    this.assertUrlNotNullAndCorrectProtocol(
      this.tokenEndpoint,
      'tokenEndpoint'
    );
    let headers = new HttpHeaders().set(
      'Content-Type',
      'application/x-www-form-urlencoded'
    );

    if (this.useHttpBasicAuth) {
      const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
      headers = headers.set('Authorization', 'Basic ' + header);
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

      this.http
        .post<TokenResponse>(this.tokenEndpoint, params, { headers })
        .subscribe(
          (tokenResponse) => {
            this.debug('refresh tokenResponse', tokenResponse);
            this.storeAccessTokenResponse(
              tokenResponse.access_token,
              tokenResponse.refresh_token,
              tokenResponse.expires_in ||
                this.fallbackAccessTokenExpirationTimeInSec,
              tokenResponse.scope,
              this.extractRecognizedCustomParameters(tokenResponse)
            );

            if (this.oidc && tokenResponse.id_token) {
              this.processIdToken(
                tokenResponse.id_token,
                tokenResponse.access_token,
                options.disableNonceCheck
              )
                .then((result) => {
                  this.storeIdToken(result);

                  this.eventsSubject.next(
                    new OAuthSuccessEvent('token_received')
                  );
                  this.eventsSubject.next(
                    new OAuthSuccessEvent('token_refreshed')
                  );

                  resolve(tokenResponse);
                })
                .catch((reason) => {
                  this.eventsSubject.next(
                    new OAuthErrorEvent('token_validation_error', reason)
                  );
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
            this.eventsSubject.next(
              new OAuthErrorEvent('token_refresh_error', err)
            );
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

    if (this.requestAccessToken && !options.disableNonceCheck) {
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
        this.clearLocationHash();
      }

      this.callOnTokenReceivedIfExists(options);
      return Promise.resolve(true);
    }

    return this.processIdToken(idToken, accessToken, options.disableNonceCheck)
      .then((result) => {
        if (options.validationHandler) {
          return options
            .validationHandler({
              accessToken: accessToken,
              idClaims: result.idTokenClaims,
              idToken: result.idToken,
              state: state,
            })
            .then((_) => result);
        }
        return result;
      })
      .then((result) => {
        this.storeIdToken(result);
        this.storeSessionState(sessionState);
        if (this.clearHashAfterLogin && !options.preventClearHashAfterLogin) {
          this.clearLocationHash();
        }
        this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
        this.callOnTokenReceivedIfExists(options);
        this.inImplicitFlow = false;
        return true;
      })
      .catch((reason) => {
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

  protected validateNonce(nonceInState: string): boolean {
    let savedNonce;

    if (
      this.saveNoncesInLocalStorage &&
      typeof window['localStorage'] !== 'undefined'
    ) {
      savedNonce = localStorage.getItem('nonce');
    } else {
      savedNonce = this._storage.getItem('nonce');
    }

    if (savedNonce !== nonceInState) {
      const err = 'Validating access_token failed, wrong state/nonce.';
      console.error(err, savedNonce, nonceInState);
      return false;
    }
    return true;
  }

  protected storeIdToken(idToken: ParsedIdToken): void {
    this._storage.setItem('id_token', idToken.idToken);
    this._storage.setItem('id_token_claims_obj', idToken.idTokenClaimsJson);
    this._storage.setItem('id_token_expires_at', '' + idToken.idTokenExpiresAt);
    this._storage.setItem(
      'id_token_stored_at',
      '' + this.dateTimeService.now()
    );
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
    if (this.clearHashAfterLogin && !options.preventClearHashAfterLogin) {
      this.clearLocationHash();
    }
  }

  private getClockSkewInMsec(defaultSkewMsc = 600_000) {
    if (!this.clockSkewInSec) {
      return defaultSkewMsc;
    }
    return this.clockSkewInSec * 1000;
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

    let savedNonce;
    if (
      this.saveNoncesInLocalStorage &&
      typeof window['localStorage'] !== 'undefined'
    ) {
      savedNonce = localStorage.getItem('nonce');
    } else {
      savedNonce = this._storage.getItem('nonce');
    }

    if (Array.isArray(claims.aud)) {
      if (claims.aud.every((v) => v !== this.clientId)) {
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
        `Expected sub: ${this.silentRefreshSubject}, received sub: ${claims['sub']}`;

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
    // at_hash is not applicable to authorization code flow
    // addressing https://github.com/manfredsteyer/angular-oauth2-oidc/issues/661
    // i.e. Based on spec the at_hash check is only true for implicit code flow on Ping Federate
    // https://www.pingidentity.com/developer/en/resources/openid-connect-developers-guide.html
    if (
      this.hasOwnProperty('responseType') &&
      (this.responseType === 'code' || this.responseType === 'id_token')
    ) {
      this.disableAtHashCheck = true;
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

    const now = this.dateTimeService.now();
    const issuedAtMSec = claims.iat * 1000;
    const expiresAtMSec = claims.exp * 1000;
    const clockSkewInMSec = this.getClockSkewInMsec(); // (this.getClockSkewInMsec() || 600) * 1000;

    if (
      issuedAtMSec - clockSkewInMSec >= now ||
      expiresAtMSec + clockSkewInMSec <= now
    ) {
      const err = 'Token has expired';
      console.error(err);
      console.error({
        now: now,
        issuedAtMSec: issuedAtMSec,
        expiresAtMSec: expiresAtMSec,
      });
      return Promise.reject(err);
    }

    const validationParams: ValidationParams = {
      accessToken: accessToken,
      idToken: idToken,
      jwks: this.jwks,
      idTokenClaims: claims,
      idTokenHeader: header,
      loadKeys: () => this.loadJwks(),
    };

    if (this.disableAtHashCheck) {
      return this.checkSignature(validationParams).then((_) => {
        const result: ParsedIdToken = {
          idToken: idToken,
          idTokenClaims: claims,
          idTokenClaimsJson: claimsJson,
          idTokenHeader: header,
          idTokenHeaderJson: headerJson,
          idTokenExpiresAt: expiresAtMSec,
        };
        return result;
      });
    }

    return this.checkAtHash(validationParams).then((atHashValid) => {
      if (!this.disableAtHashCheck && this.requestAccessToken && !atHashValid) {
        const err = 'Wrong at_hash';
        this.logger.warn(err);
        return Promise.reject(err);
      }

      return this.checkSignature(validationParams).then((_) => {
        const atHashCheckEnabled = !this.disableAtHashCheck;
        const result: ParsedIdToken = {
          idToken: idToken,
          idTokenClaims: claims,
          idTokenClaimsJson: claimsJson,
          idTokenHeader: header,
          idTokenHeaderJson: headerJson,
          idTokenExpiresAt: expiresAtMSec,
        };
        if (atHashCheckEnabled) {
          return this.checkAtHash(validationParams).then((atHashValid) => {
            if (this.requestAccessToken && !atHashValid) {
              const err = 'Wrong at_hash';
              this.logger.warn(err);
              return Promise.reject(err);
            } else {
              return result;
            }
          });
        } else {
          return result;
        }
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
    return this._storage ? this._storage.getItem('id_token') : null;
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
    return this._storage ? this._storage.getItem('access_token') : null;
  }

  public getRefreshToken(): string {
    return this._storage ? this._storage.getItem('refresh_token') : null;
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
      const now = this.dateTimeService.new();
      if (
        expiresAt &&
        parseInt(expiresAt, 10) < now.getTime() - this.getClockSkewInMsec()
      ) {
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
      const now = this.dateTimeService.new();
      if (
        expiresAt &&
        parseInt(expiresAt, 10) < now.getTime() - this.getClockSkewInMsec()
      ) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Retrieve a saved custom property of the TokenReponse object. Only if predefined in authconfig.
   */
  public getCustomTokenResponseProperty(requestedProperty: string): any {
    return this._storage &&
      this.config.customTokenParameters &&
      this.config.customTokenParameters.indexOf(requestedProperty) >= 0 &&
      this._storage.getItem(requestedProperty) !== null
      ? JSON.parse(this._storage.getItem(requestedProperty))
      : null;
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
   * redirected to it with optional state parameter.
   * @param noRedirectToLogoutUrl
   * @param state
   */
  public logOut(): void;
  public logOut(customParameters: boolean | object): void;
  public logOut(noRedirectToLogoutUrl: boolean): void;
  public logOut(noRedirectToLogoutUrl: boolean, state: string): void;
  public logOut(customParameters: boolean | object = {}, state = ''): void {
    let noRedirectToLogoutUrl = false;
    if (typeof customParameters === 'boolean') {
      noRedirectToLogoutUrl = customParameters;
      customParameters = {};
    }

    const id_token = this.getIdToken();
    this._storage.removeItem('access_token');
    this._storage.removeItem('id_token');
    this._storage.removeItem('refresh_token');

    if (this.saveNoncesInLocalStorage) {
      localStorage.removeItem('nonce');
      localStorage.removeItem('PKCE_verifier');
    } else {
      this._storage.removeItem('nonce');
      this._storage.removeItem('PKCE_verifier');
    }

    this._storage.removeItem('expires_at');
    this._storage.removeItem('id_token_claims_obj');
    this._storage.removeItem('id_token_expires_at');
    this._storage.removeItem('id_token_stored_at');
    this._storage.removeItem('access_token_stored_at');
    this._storage.removeItem('granted_scopes');
    this._storage.removeItem('session_state');
    if (this.config.customTokenParameters) {
      this.config.customTokenParameters.forEach((customParam) =>
        this._storage.removeItem(customParam)
      );
    }
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
        "logoutUrl  must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
      );
    }

    // For backward compatibility
    if (this.logoutUrl.indexOf('{{') > -1) {
      logoutUrl = this.logoutUrl
        .replace(/\{\{id_token\}\}/, encodeURIComponent(id_token))
        .replace(/\{\{client_id\}\}/, encodeURIComponent(this.clientId));
    } else {
      let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() });

      if (id_token) {
        params = params.set('id_token_hint', id_token);
      }

      const postLogoutUrl =
        this.postLogoutRedirectUri ||
        (this.redirectUriAsPostLogoutRedirectUriFallback && this.redirectUri) ||
        '';
      if (postLogoutUrl) {
        params = params.set('post_logout_redirect_uri', postLogoutUrl);

        if (state) {
          params = params.set('state', state);
        }
      }

      for (let key in customParameters) {
        params = params.set(key, customParameters[key]);
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
      // Use localStorage for nonce if possible
      // localStorage is the only storage who survives a
      // redirect in ALL browsers (also IE)
      // Otherwiese we'd force teams who have to support
      // IE into using localStorage for everything
      if (
        that.saveNoncesInLocalStorage &&
        typeof window['localStorage'] !== 'undefined'
      ) {
        localStorage.setItem('nonce', nonce);
      } else {
        that._storage.setItem('nonce', nonce);
      }
      return nonce;
    });
  }

  /**
   * @ignore
   */
  public ngOnDestroy(): void {
    this.clearAccessTokenTimer();
    this.clearIdTokenTimer();

    this.removeSilentRefreshEventListener();
    const silentRefreshFrame = this.document.getElementById(
      this.silentRefreshIFrameName
    );
    if (silentRefreshFrame) {
      silentRefreshFrame.remove();
    }

    this.stopSessionCheckTimer();
    this.removeSessionCheckEventListener();
    const sessionCheckFrame = this.document.getElementById(
      this.sessionCheckIFrameName
    );
    if (sessionCheckFrame) {
      sessionCheckFrame.remove();
    }
  }

  protected createNonce(): Promise<string> {
    return new Promise((resolve) => {
      if (this.rngUrl) {
        throw new Error(
          'createNonce with rng-web-api has not been implemented so far'
        );
      }

      /*
       * This alphabet is from:
       * https://tools.ietf.org/html/rfc7636#section-4.1
       *
       * [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
       */
      const unreserved =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let size = 45;
      let id = '';

      const crypto =
        typeof self === 'undefined' ? null : self.crypto || self['msCrypto'];
      if (crypto) {
        let bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);

        // Needed for IE
        if (!bytes.map) {
          (bytes as any).map = Array.prototype.map;
        }

        bytes = bytes.map((x) => unreserved.charCodeAt(x % unreserved.length));
        id = String.fromCharCode.apply(null, bytes);
      } else {
        while (0 < size--) {
          id += unreserved[(Math.random() * unreserved.length) | 0];
        }
      }

      resolve(base64UrlEncode(id));
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
  public initLoginFlow(additionalState = '', params = {}): void {
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
  public initCodeFlow(additionalState = '', params = {}): void {
    if (this.loginUrl !== '') {
      this.initCodeFlowInternal(additionalState, params);
    } else {
      this.events
        .pipe(filter((e) => e.type === 'discovery_document_loaded'))
        .subscribe((_) => this.initCodeFlowInternal(additionalState, params));
    }
  }

  private initCodeFlowInternal(additionalState = '', params = {}): void {
    if (!this.validateUrlForHttps(this.loginUrl)) {
      throw new Error(
        "loginUrl  must use HTTPS (with TLS), or config value for property 'requireHttps' must be set to 'false' and allow HTTP (without TLS)."
      );
    }

    let addParams = {};
    let loginHint = null;
    if (typeof params === 'string') {
      loginHint = params;
    } else if (typeof params === 'object') {
      addParams = params;
    }

    this.createLoginUrl(additionalState, loginHint, null, false, addParams)
      .then(this.config.openUri)
      .catch((error) => {
        console.error('Error in initAuthorizationCodeFlow');
        console.error(error);
      });
  }

  protected async createChallangeVerifierPairForPKCE(): Promise<
    [string, string]
  > {
    if (!this.crypto) {
      throw new Error(
        'PKCE support for code flow needs a CryptoHander. Did you import the OAuthModule using forRoot() ?'
      );
    }

    const verifier = await this.createNonce();
    const challengeRaw = await this.crypto.calcHash(verifier, 'sha-256');
    const challenge = base64UrlEncode(challengeRaw);

    return [challenge, verifier];
  }

  private extractRecognizedCustomParameters(
    tokenResponse: TokenResponse
  ): Map<string, string> {
    let foundParameters: Map<string, string> = new Map<string, string>();
    if (!this.config.customTokenParameters) {
      return foundParameters;
    }
    this.config.customTokenParameters.forEach((recognizedParameter: string) => {
      if (tokenResponse[recognizedParameter]) {
        foundParameters.set(
          recognizedParameter,
          JSON.stringify(tokenResponse[recognizedParameter])
        );
      }
    });
    return foundParameters;
  }

  /**
   * Revokes the auth token to secure the vulnarability
   * of the token issued allowing the authorization server to clean
   * up any security credentials associated with the authorization
   */
  public revokeTokenAndLogout(
    customParameters: boolean | object = {},
    ignoreCorsIssues = false
  ): Promise<any> {
    let revokeEndpoint = this.revocationEndpoint;
    let accessToken = this.getAccessToken();
    let refreshToken = this.getRefreshToken();

    if (!accessToken) {
      return;
    }

    let params = new HttpParams({ encoder: new WebHttpUrlEncodingCodec() });

    let headers = new HttpHeaders().set(
      'Content-Type',
      'application/x-www-form-urlencoded'
    );

    if (this.useHttpBasicAuth) {
      const header = btoa(`${this.clientId}:${this.dummyClientSecret}`);
      headers = headers.set('Authorization', 'Basic ' + header);
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

    return new Promise((resolve, reject) => {
      let revokeAccessToken: Observable<void>;
      let revokeRefreshToken: Observable<void>;

      if (accessToken) {
        let revokationParams = params
          .set('token', accessToken)
          .set('token_type_hint', 'access_token');
        revokeAccessToken = this.http.post<void>(
          revokeEndpoint,
          revokationParams,
          { headers }
        );
      } else {
        revokeAccessToken = of(null);
      }

      if (refreshToken) {
        let revokationParams = params
          .set('token', refreshToken)
          .set('token_type_hint', 'refresh_token');
        revokeRefreshToken = this.http.post<void>(
          revokeEndpoint,
          revokationParams,
          { headers }
        );
      } else {
        revokeRefreshToken = of(null);
      }

      if (ignoreCorsIssues) {
        revokeAccessToken = revokeAccessToken.pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 0) {
              return of<void>(null);
            }
            return throwError(err);
          })
        );

        revokeRefreshToken = revokeRefreshToken.pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 0) {
              return of<void>(null);
            }
            return throwError(err);
          })
        );
      }

      combineLatest([revokeAccessToken, revokeRefreshToken]).subscribe(
        (res) => {
          this.logOut(customParameters);
          resolve(res);
          this.logger.info('Token successfully revoked');
        },
        (err) => {
          this.logger.error('Error revoking token', err);
          this.eventsSubject.next(
            new OAuthErrorEvent('token_revoke_error', err)
          );
          reject(err);
        }
      );
    });
  }

  /**
   * Clear location.hash if it's present
   */
  private clearLocationHash() {
    // Checking for empty hash is necessary for Firefox
    // as setting an empty hash to an empty string adds # to the URL
    if (location.hash != '') {
      location.hash = '';
    }
  }
}
