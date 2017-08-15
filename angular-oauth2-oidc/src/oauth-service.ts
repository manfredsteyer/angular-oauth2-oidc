import { Http, URLSearchParams, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ValidationHandler, ValidationParams } from "./token-validation/validation-handler";
import { NullValidationHandler } from "./token-validation/null-validation-handler";
import { UrlHelperService } from "./url-helper.service";
import { Subscription } from "rxjs/Subscription";
import { OAuthEvent, OAuthInfoEvent, OAuthErrorEvent, OAuthSuccessEvent } from "./events";
import { OAuthStorage, LoginOptions, ParsedIdToken } from "./types";

/**
 * Service for logging in and logging out with
 * OIDC and OAuth2. Supports implicit flow and
 * password flow.
 */
@Injectable()
export class OAuthService {

    /**
     * The client's id as registered with the auth server
     */
    public clientId = "";

    /**
     * The client's redirectUri as registered with the auth server
     */
    public redirectUri = "";

    /**
     * An optional second redirectUri where the auth server
     * redirects the user to after logging out.
     */
    public postLogoutRedirectUri = "";

    /**
     * The auth server's endpoint that allows to log
     * the user in when using implicit flow.
     */
    public loginUrl = "";

    /**
     * The requested scopes
     */
    public scope = "openid profile";

    public resource = "";
    public rngUrl = "";

    /**
     * Defines whether to use OpenId Connect during
     * implicit flow.
     */
    public oidc: boolean = true;

    /**
     * Defines whether to request a access token during
     * implicit flow.
     */
    public requestAccessToken: boolean = true;
    public options: any;
    
    /**
     * The received (passed around) state, when logging
     * in with implicit flow.
     */
    public state = "";

    /**
     * The issuer's uri.
     */
    public issuer = "";

    /**
     * The logout url.
     */
    public logoutUrl = "";

    /**
     * Defines whether to clear the hash fragment after logging in.
     */
    public clearHashAfterLogin: boolean = true;

    /**
     * Url of the token endpoint as defined by OpenId Connect and OAuth 2.
     */
    public tokenEndpoint: string;

    /**
     * Url of the userinfo endpoint as defined by OpenId Connect.
     */
    public userinfoEndpoint: string;

    public responseType: string = "token";

    /**
     * Defines whether additional debug information should 
     * be shown at the console.
     */
    public showDebugInformation: boolean = false;

    /**
     * The redirect uri used when doing silent refresh.
     */
    public silentRefreshRedirectUri: string = '';

    public silentRefreshMessagePrefix: string = '';

    /**
     * Timeout for silent refresh. 
     */
    public siletRefreshTimeout: number = 1000 * 20; 

    /**
     * Some auth servers don't allow using password flow
     * w/o a client secreat while the standards do not
     * demand for it. In this case, you can set a password
     * here. As this passwort is exposed to the public
     * it does not bring additional security and is therefore
     * as good as using no password.
     */
    public dummyClientSecret: string;

    /**
     * The ValidationHandler used to validate received
     * id_tokens.
     */
    public tokenValidationHandler: ValidationHandler;

    /**
     * Defines whether https is required.
     * The default value is remoteOnly which only allows
     * http for location, while every other domains need
     * to be used with https.
     */
    public requireHttps: boolean | 'remoteOnly' = 'remoteOnly';
    
    /**
     * Defines whether every url provided by the discovery 
     * document has to start with the issuer's url.
     */
    public strictDiscoveryDocumentValidation: boolean = true;

    /**
     * JSON Web Key Set (https://tools.ietf.org/html/rfc7517)
     * with keys used to validate received id_tokens.
     * This is taken out of the disovery document. Can be set manually too.
     */
    public jwks: object;

    /**
     * Map with additional query parameter that are appended to
     * the request when initializing implicit flow.
     */
    public customQueryParams: object;

    /**
     * @internal
     * Deprecated:  use property events instead
     */
    
    public discoveryDocumentLoaded: boolean = false;
  
    /**
     * @internal
     * Deprecated:  use property events instead
     */
    public discoveryDocumentLoaded$: Observable<object>;
    
    private discoveryDocumentLoadedSubject: Subject<object> = new Subject<object>();

    /**
     * Informs about events, like token_received or token_expires.
     * See the string enum EventType for a full list of events.
     */
    public events: Observable<OAuthEvent>;
    private eventsSubject: Subject<OAuthEvent> = new Subject<OAuthEvent>();

    public silentRefreshIFrameName: string = 'angular-oauth-oidc-silent-refresh-iframe';
    private silentRefreshPostMessageEventListener: EventListener;

    private grantTypesSupported: Array<string> = [];
    private _storage: OAuthStorage;

    /**
     * Defines when the token_timeout event should be raised.
     * If you set this to the default value 0.75, the event
     * is triggered after 75% of the token's life time.
     */
    public timeoutFactor: number = 0.75;

    private accessTokenTimeoutSubscription: Subscription;
    private idTokenTimeoutSubscription: Subscription;

    constructor(
        private http: Http,
        private urlHelper: UrlHelperService) {
     
        this.discoveryDocumentLoaded$ = this.discoveryDocumentLoadedSubject.asObservable();
        this.events = this.eventsSubject.asObservable();

        if (sessionStorage) {
            this._storage = sessionStorage;
        }

        this.setupTimer();
    }

    private getKeyCount(): number {
        if (!this.jwks) return 0;
        if (!this.jwks['keys']) return 0;
        return this.jwks['keys'].length;
    }


    private debug(...args): void {
        if (this.showDebugInformation) {
            console.debug.apply(console, args);
        }
    }

    private validateUrlFromDiscoveryDocument(url: string): string[] {

        let errors: string[] = [];
        let httpsCheck = this.validateUrlForHttps(url);
        let issuerCheck = this.validateUrlAgainstIssuer(url);

        if (!httpsCheck) {
            errors.push('https for all urls required. Also for urls received by discovery.');
        }

        if (!issuerCheck) {
            errors.push('Every url in discovery document has to start with the issuer url. Also see property strictDiscoveryDocumentValidation.');
        }

        return errors;
    }

    private validateUrlForHttps(url: string): boolean {
        let lcUrl = url.toLowerCase();
        
        if (this.requireHttps == false) return true;

        if ((lcUrl.match(/^http:\/\/localhost($|[:\/])/) 
            || lcUrl.match(/^http:\/\/localhost($|[:\/])/))
            && this.requireHttps == 'remoteOnly') {
                return true;
        }

        return lcUrl.startsWith('https://');
    }

    private validateUrlAgainstIssuer(url: string) {
        if (!this.strictDiscoveryDocumentValidation) return true;
        return url.toLowerCase().startsWith(this.issuer.toLowerCase());
    }

    private setupTimer(): void {
        
        if (!window) {
            this.debug('timer not supported on this plattform')
            return;
        } 

        this.events.filter(e => e.type == 'token_received').subscribe(_ => {
            
            this.clearAccessTokenTimer();
            this.clearIdTokenTimer();

            let now = Date.now();

            if (this.hasValidAccessToken()) {
                this.setupAccessTokenTimer();
            }

            if (this.hasValidIdToken()) {
                this.setupIdTokenTimer();
            }

        });
    }

    private setupAccessTokenTimer(): void {
        let expiration = this.getAccessTokenExpiration();
        let timeout = this.calcTimeout(expiration);
        
        this.accessTokenTimeoutSubscription = 
            Observable
                .of(new OAuthInfoEvent('token_expires', 'access_token'))
                .delay(timeout)
                .subscribe(e => this.eventsSubject.next(e));
    }


    private setupIdTokenTimer(): void {
        let expiration = this.getAccessTokenExpiration();
        let timeout = this.calcTimeout(expiration);
        
        this.accessTokenTimeoutSubscription = 
            Observable
                .of(new OAuthInfoEvent('token_expires', 'id_token'))
                .delay(timeout)
                .subscribe(this.eventsSubject);
    }

    private clearAccessTokenTimer(): void {
        if (this.accessTokenTimeoutSubscription) {
            this.accessTokenTimeoutSubscription.unsubscribe();
        }
    }

    private clearIdTokenTimer(): void {
        if (this.idTokenTimeoutSubscription) {
            this.idTokenTimeoutSubscription.unsubscribe();
        }
    }

    private calcTimeout(expiration: number): number {
        let now = Date.now();
        let delta = (expiration - now) * this.timeoutFactor;
        let timeout = now + delta;
        return timeout;
    }

    /**
     * Sets a custom storage used to store the received
     * tokens on client side. By default, the browser's
     * sessionStorage is used.
     * 
     * @param storage 
     */
    public setStorage(storage: OAuthStorage): void {
        this._storage = storage;
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
                fullUrl = this.issuer + '/.well-known/openid-configuration';
            }

            if (!this.validateUrlForHttps(fullUrl)) {
                reject('loginUrl must use Http. Also check property requireHttps.');
                return;
            }
    
            this.http.get(fullUrl).map(r => r.json()).subscribe(
                (doc) => {

                    if (!this.validateDiscoveryDocument(doc)) {
                        this.eventsSubject.next(new OAuthErrorEvent('discovery_document_validation_error', null));
                        reject('discovery_document_validation_error');
                        return;
                    }

                    this.loginUrl = doc.authorization_endpoint;
                    this.logoutUrl = doc.end_session_endpoint;
                    this.grantTypesSupported = doc.grant_types_supported;
                    this.issuer = doc.issuer;
                    this.tokenEndpoint = doc.token_endpoint;
                    this.userinfoEndpoint = doc.userinfo_endpoint;

                    this.discoveryDocumentLoaded = true;
                    this.discoveryDocumentLoadedSubject.next(doc);

                    if (doc.jwks_uri) {
                        this.http.get(doc.jwks_uri).map(r => r.json()).subscribe(
                            jwks => {
                                this.jwks = jwks;
                                this.eventsSubject.next(new OAuthSuccessEvent('discovery_document_loaded'));
                                resolve(doc);
                            },
                            err => {
                                console.error('error loading jwks', err);
                                this.eventsSubject.next(new OAuthErrorEvent('jwks_load_error', err));
                                reject(err);
                            }
                        )
                    }
                    else {
                        this.eventsSubject.next(new OAuthSuccessEvent('discovery_document_loaded'));
                        resolve(doc);
                    }
                },
                (err) => {
                    console.error('error loading dicovery document', err);
                    this.eventsSubject.next(new OAuthErrorEvent('discovery_document_load_error', err));
                    reject(err);
                }
            );
        });
    }

    private validateDiscoveryDocument(doc: object): boolean {

        let errors: string[];

        if (doc['issuer'] != this.issuer) {
            console.error(
                'invalid issuer in discovery document',
                'expected: ' + this.issuer,
                'current: ' + doc['issuer']
            );
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc['authorization_endpoint']);
        if (errors.length > 0) {
            console.error('error validating authorization_endpoint in discovery document', errors);
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc['end_session_endpoint']);
        if (errors.length > 0) {
            console.error('error validating end_session_endpoint in discovery document', errors);
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc['token_endpoint']);
        if (errors.length > 0) {
            console.error('error validating token_endpoint in discovery document', errors);
        }

        errors = this.validateUrlFromDiscoveryDocument(doc['userinfo_endpoint']);
        if (errors.length > 0) {
            console.error('error validating userinfo_endpoint in discovery document', errors);
            return false;
        }

        errors = this.validateUrlFromDiscoveryDocument(doc['jwks_uri']);
        if (errors.length > 0) {
            console.error('error validating jwks_uri in discovery document', errors);
            return false;
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
     * Otherwise stricter validations take happen that makes this operation
     * fail.
     * 
     * @param userName 
     * @param password 
     * @param headers Optional additional http-headers.
     */
    public fetchTokenUsingPasswordFlowAndLoadUserProfile(userName: string, password: string, headers: Headers = new Headers()): Promise<object> {
        return this
                .fetchTokenUsingPasswordFlow(userName, password, headers)
                .then(() => this.loadUserProfile());
    }

    /**
     * Loads the user profile by accessing the user info endpoint defined by OpenId Connect.
     * 
     * When using this with OAuth2 password flow, make sure that the property oidc is set to false.
     * Otherwise stricter validations take happen that makes this operation
     * fail.
     */
    public loadUserProfile(): Promise<object> {
        if (!this.hasValidAccessToken()) throw new Error("Can not load User Profile without access_token");
        if (!this.validateUrlForHttps(this.userinfoEndpoint)) throw new Error('userinfoEndpoint must use Http. Also check property requireHttps.');
        
        return new Promise((resolve, reject) => {

            let headers = new Headers();
            headers.set('Authorization', 'Bearer ' + this.getAccessToken());

            this.http.get(this.userinfoEndpoint, { headers }).map(r => r.json()).subscribe(
                (doc) => {
                    this.debug('userinfo received', doc);

                    let existingClaims = this.getIdentityClaims() || {};
                    if (this.oidc && (!existingClaims['sub'] || doc.sub != existingClaims['sub'])) {
                        let err = 'if property oidc is true, the received user-id (sub) has to be the user-id of the user that has logged in with oidc.\n'
                                    + 'if you are not using oidc but just oauth2 password flow set oidc to false';

                        reject(err);
                        return;
                    }

                    doc = Object.assign({}, existingClaims, doc);

                    this._storage.setItem('id_token_claims_obj', JSON.stringify(doc));
                    this.eventsSubject.next(new OAuthSuccessEvent('user_profile_loaded'));
                    resolve(doc);
                },
                (err) => {
                    console.error('error loading user info', err);
                    this.eventsSubject.next(new OAuthErrorEvent('user_profile_load_error', err));
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
    public fetchTokenUsingPasswordFlow(userName: string, password: string, headers: Headers = new Headers()): Promise<object> {

        if (!this.validateUrlForHttps(this.tokenEndpoint)) throw new Error('tokenEndpoint must use Http. Also check property requireHttps.');

        return new Promise((resolve, reject) => { 
            let search = new URLSearchParams();
            search.set('grant_type', 'password');
            search.set('client_id', this.clientId);
            search.set('scope', this.scope);
            search.set('username', userName);
            search.set('password', password);
            
            if (this.dummyClientSecret) {
                search.set('client_secret', this.dummyClientSecret);
            }

            headers.set('Content-Type', 'application/x-www-form-urlencoded');

            let params = search.toString();

            this.http.post(this.tokenEndpoint, params, { headers }).map(r => r.json()).subscribe(
                (tokenResponse) => {
                    this.debug('tokenResponse', tokenResponse);
                    this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in);

                    this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                    resolve(tokenResponse);
                },
                (err) => {
                    console.error('Error performing password flow', err);
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

        if (!this.validateUrlForHttps(this.tokenEndpoint)) throw new Error('tokenEndpoint must use Http. Also check property requireHttps.');

        return new Promise((resolve, reject) => { 
            let search = new URLSearchParams();
            search.set('grant_type', 'refresh_token');
            search.set('client_id', this.clientId);
            search.set('scope', this.scope);
            search.set('refresh_token', this._storage.getItem('refresh_token'));
            
            if (this.dummyClientSecret) {
                search.set('client_secret', this.dummyClientSecret);
            }

            let headers = new Headers();
            headers.set('Content-Type', 'application/x-www-form-urlencoded');

            let params = search.toString();

            this.http.post(this.tokenEndpoint, params, { headers }).map(r => r.json()).subscribe(
                (tokenResponse) => {
                    this.debug('refresh tokenResponse', tokenResponse);
                    this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in);
                    
                    this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                    this.eventsSubject.next(new OAuthSuccessEvent('token_refreshed'));
                    resolve(tokenResponse);
                },
                (err) => {
                    console.error('Error performing password flow', err);
                    this.eventsSubject.next(new OAuthErrorEvent('token_refresh_error', err));
                    reject(err);
                }
            );
        });
    }

    private removeSilentRefreshEventListener(): void {
        if (this.silentRefreshPostMessageEventListener) {
            window.removeEventListener('message', this.silentRefreshPostMessageEventListener);
            this.silentRefreshPostMessageEventListener = null;
        }
    }

    private setupSilentRefreshEventListener(): void {
        this.removeSilentRefreshEventListener();
        
        this.silentRefreshPostMessageEventListener = (e: MessageEvent) => {

            let expectedPrefix = '#';

            if (this.silentRefreshMessagePrefix) {
                expectedPrefix += this.silentRefreshMessagePrefix;
            }

            if (!e || !e.data || typeof e.data != 'string' ) return;
            
            let prefixedMessage: string = e.data;

            if (!prefixedMessage.startsWith(expectedPrefix)) return;

            let message = '#' + prefixedMessage.substr(expectedPrefix.length);

            this.tryLogin({
                customHashFragment: message,
                onLoginError: (err) => {
                    this.eventsSubject.next(new OAuthErrorEvent('silent_refresh_error', err));
                },
                onTokenReceived: () => {
                    this.eventsSubject.next(new OAuthSuccessEvent('silently_refreshed'));
                }
            });
        }

        window.addEventListener('message', this.silentRefreshPostMessageEventListener);
    }

    
    /**
     * Performs a silent refresh for implicit flow.
     * Use this method to get a new tokens when/ before 
     * the existing tokens expires.
     */
    public silentRefresh(): Promise<OAuthEvent> {
        
        if (!this.validateUrlForHttps(this.loginUrl)) throw new Error('tokenEndpoint must use Http. Also check property requireHttps.');

        if (!document) {
            throw new Error('silent refresh is not supported on this platform');
        } 

        let existingIframe = document.getElementById(this.silentRefreshIFrameName);
        if (existingIframe) {
            document.body.removeChild(existingIframe);
        }

        let iframe = document.createElement('iframe');
        iframe.id = this.silentRefreshIFrameName;

        this.setupSilentRefreshEventListener();

        let redirectUri = this.silentRefreshRedirectUri || this.redirectUri;
        this.createLoginUrl(null, null, redirectUri).then(url => {
            iframe.setAttribute('src', url);
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
        });

        let errors = this.events.filter(e => e instanceof OAuthErrorEvent).first();
        let success = this.events.filter(e => e.type == 'silently_refreshed').first();
        let timeout = Observable.of(new OAuthErrorEvent('silent_refresh_timeout', null))
                                .delay(this.siletRefreshTimeout);

        return Observable
                .race([errors, success, timeout])
                .do(e => {
                    if (e.type == 'silent_refresh_timeout') {
                        this.eventsSubject.next(e);
                    }
                })
                .map(e => {
                    if (e instanceof OAuthErrorEvent) {
                        throw e;
                    }
                    return e;
                })
                .toPromise();
    }
    
    private createLoginUrl(
        state: string = '', 
        loginHint: string = '',
        customRedirectUri: string = ''
    ) {
        var that = this;

        let redirectUri: string;

        if (customRedirectUri) {
            redirectUri = customRedirectUri;
        }
        else {
            redirectUri = this.redirectUri;
        }

        return this.createAndSaveNonce().then((nonce: any) => {

            if (state) {
                state = nonce + ";" + state;
            }
            else {
                state = nonce;   
            }

            if (!this.requestAccessToken && !this.oidc) {
                throw new Error('Either requestAccessToken or oidc or both must be true');
            }

            if (this.oidc && this.requestAccessToken) {
                this.responseType = "id_token token";
            }
            else if (this.oidc && !this.requestAccessToken) {
                this.responseType = 'id_token'
            }
            else {
                this.responseType = 'token';
            }

            let seperationChar = (that.loginUrl.indexOf('?') > -1) ? '&' : '?';

            let scope = that.scope;

            if (this.oidc && !scope.match(/(^|\s)openid($|\s)/)) {
                scope = 'openid ' + scope;
            }

            var url = that.loginUrl 
                        + seperationChar
                        + "response_type="
                        + encodeURIComponent(that.responseType)
                        + "&client_id="
                        + encodeURIComponent(that.clientId)
                        + "&state=" 
                        + encodeURIComponent(state)
                        + "&redirect_uri=" 
                        + encodeURIComponent(redirectUri) 
                        + "&scope=" 
                        + encodeURIComponent(scope)
                        + "&login_hint="
                        + encodeURIComponent(loginHint);

            if (that.resource) {
                url += "&resource=" + encodeURIComponent(that.resource);
            }
            
            if (that.oidc) {
                url += "&nonce=" + encodeURIComponent(nonce);
            }

            if (this.customQueryParams) {
                for(let key of Object.getOwnPropertyNames(this.customQueryParams)) {
                    url += "&" + key + "=" + encodeURIComponent(this.customQueryParams[key]);
                }
            }
            
            return url;
        });
    };

    /**
     * Starts the implicit flow and redirects to user to
     * the auth servers login url. 
     * 
     * @param additionalState Optinal state that is passes around. You find this state in the property ``state`` after ``tryLogin`` logged in the user.
     * @param loginHint 
     */
    public initImplicitFlow(additionalState = "", loginHint=""): void {
        
        if (!this.validateUrlForHttps(this.loginUrl)) {
            throw new Error('loginUrl must use Http. Also check property requireHttps.');
        }

        this.createLoginUrl(additionalState, loginHint).then(function (url) {
            location.href = url;
        })
        .catch(error => {
            console.error("Error in initImplicitFlow");
            console.error(error);
        });
    };
    
    private callOnTokenReceivedIfExists(options: LoginOptions): void {
        var that = this;
        if (options.onTokenReceived) {
            var tokenParams = { 
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state
            };
            options.onTokenReceived(tokenParams);
        }
    }

    private storeAccessTokenResponse(accessToken: string, refreshToken: string, expiresIn: number): void {
        this._storage.setItem("access_token", accessToken);

        if (expiresIn) {
            var expiresInMilliSeconds = expiresIn * 1000;
            var now = new Date();
            var expiresAt = now.getTime() + expiresInMilliSeconds;
            this._storage.setItem("expires_at", "" + expiresAt);
        }

        if (refreshToken) {
            this._storage.setItem("refresh_token", refreshToken);
        }
    }

    private receivedFirstToken = true;

    /**
     * Checks whether there are tokens in the hash fragment
     * as a result of the implicit flow. These tokens are
     * parsed, validated and used to sign the user in to the
     * current client.
     * 
     * @param options Optinal options.
     */
    public tryLogin(options: LoginOptions = null): Promise<void> {
        
        options = options || { };
            
        let parts: object;

        if (options.customHashFragment) {
            parts = this.urlHelper.getHashFragmentParams(options.customHashFragment);
        }
        else {
            parts = this.urlHelper.getHashFragmentParams();
        }

        if (parts["error"]) {
            this.debug('error trying to login');
            this.handleLoginError(options, parts);
            let err = new OAuthErrorEvent('token_error', {}, parts);
            this.eventsSubject.next(err);
            return Promise.reject(err);
        }

        var accessToken = parts["access_token"];
        var idToken = parts["id_token"];
        var state = decodeURIComponent(parts["state"]);
        
        if (!this.requestAccessToken && !this.oidc) {
            return Promise.reject('Either requestAccessToken or oidc or both must be true.');
        }

        if (this.requestAccessToken && (!accessToken || !state)) return Promise.resolve();
        if (this.oidc && !idToken) return Promise.resolve();
        
        var stateParts = state.split(';');
        if (stateParts.length > 1) {
            this.state = stateParts[1];
        }
        var nonceInState = stateParts[0];


        // Our state might be URL encoded
        // Check for this and then decode it if it is
        // TODO: Check this!
        /*
        let decodedState = decodeURIComponent(state);
        if (decodedState != state) {
          state = decodedState;
        }
        */
        if (this.requestAccessToken) {
            let success = this.validateNonceForAccessToken(accessToken, nonceInState);
            if (!success) {
                let event = new OAuthErrorEvent('invalid_nonce_in_state', null);
                this.eventsSubject.next(event);
                return Promise.reject(event);
            }
            this.storeAccessTokenResponse(accessToken, null, parts['expires_in']);
        }

        if (!this.oidc) return Promise.resolve();

        return this
                .processIdToken(idToken, accessToken)
                .then(result => {
                    if (options.validationHandler) {
                        return options.validationHandler({
                            accessToken: accessToken,
                            idClaims: result.idTokenClaims,
                            idToken: result.idToken,
                            state: state
                        }).then(_ => result);
                    }
                    return result;
                })
                .then(result => {
                        this.storeIdToken(result);
                        this.eventsSubject.next(new OAuthSuccessEvent('token_received'));
                        this.callOnTokenReceivedIfExists(options);
                        if (this.clearHashAfterLogin) location.hash = '';
                    })
                .catch(reason => {
                    this.eventsSubject.next(new OAuthErrorEvent('token_validation_error', reason));
                    console.error('Error validating tokens');
                    console.error(reason);
                });
        
    };

    private validateNonceForAccessToken(accessToken: string, nonceInState: string): boolean {
        var savedNonce = this._storage.getItem("nonce");
        if (savedNonce !== nonceInState) {
            let err = 'validating access_token failed. wrong state/nonce.';
            console.error(err, savedNonce, nonceInState);
            return false;
        }
        return true;
    }

    protected storeIdToken(idToken: ParsedIdToken) {
        this._storage.setItem("id_token", idToken.idToken);
        this._storage.setItem("id_token_claims_obj", idToken.idTokenClaimsJson);
        this._storage.setItem("id_token_expires_at", "" + idToken.idTokenExpiresAt);
    }

    private handleLoginError(options: LoginOptions, parts: object): void {
        var savedNonce = this._storage.getItem("nonce");
        if (options.onLoginError) 
            options.onLoginError(parts)
        if (this.clearHashAfterLogin) location.hash = '';
    }
    

    protected processIdToken(idToken: string, accessToken: string): Promise<ParsedIdToken>  {
            
            let tokenParts = idToken.split(".");
            let headerBase64 = this.padBase64(tokenParts[0]);
            let headerJson = atob(headerBase64);
            let header = JSON.parse(headerJson);
            let claimsBase64 = this.padBase64(tokenParts[1]);
            let claimsJson = atob(claimsBase64);
            let claims = JSON.parse(claimsJson);
            let savedNonce = this._storage.getItem("nonce");
            
            if (Array.isArray(claims.aud)) {
                if (claims.aud.every(v => v !== this.clientId)) {
                    let err = "Wrong audience: " + claims.aud.join(",");
                    console.warn(err);
                    return Promise.reject(err);
                }
            } else {
                if (claims.aud !== this.clientId) {
                    let err = "Wrong audience: " + claims.aud;
                    console.warn(err);
                    return Promise.reject(err);
                }
            }

            if (this.getKeyCount() > 1 && !claims.kid) {
                let err = 'There needs to be a kid claim in the id_token when multiple keys are defined via the property jwks';
                console.warn(err);
                return Promise.reject(err);
            }

            if (!claims.sub) {
                let err = "No sub claim in id_token";
                console.warn(err);
                return Promise.reject(err);
            }

            if (!claims.iat) {
                let err = "No iat claim in id_token";
                console.warn(err);
                return Promise.reject(err);
            }

            if (claims.iss !== this.issuer) {
                let err = "Wrong issuer: " + claims.iss;
                console.warn(err);
                return Promise.reject(err);
            }

            if (claims.nonce !== savedNonce) {
                let err = "Wrong nonce: " + claims.nonce;
                console.warn(err);
                return Promise.reject(err);
            }

            let now = Date.now();
            let issuedAtMSec = claims.iat * 1000;
            let expiresAtMSec = claims.exp * 1000;
            let tenMinutesInMsec = 1000 * 60 * 10;

            if (issuedAtMSec - tenMinutesInMsec >= now  || expiresAtMSec + tenMinutesInMsec <= now) {
                let err = "Token has been expired";
                console.error(err);
                console.error({
                    now: now,
                    issuedAtMSec: issuedAtMSec,
                    expiresAtMSec: expiresAtMSec
                });
                return Promise.reject(err);
            }

            let validationParams: ValidationParams = {
                accessToken: accessToken,
                idToken: idToken,
                jwks: this.jwks,
                idTokenClaims: claims,
                idTokenHeader: header
            };

            if (this.requestAccessToken && !this.checkAtHash(validationParams)) {
                let err = "Wrong at_hash";
                console.warn(err);
                return Promise.reject(err);
            }

            return this.checkSignature(validationParams).then(_ => {
                let result: ParsedIdToken = {
                    idToken: idToken,
                    idTokenClaims: claims,
                    idTokenClaimsJson: claimsJson,
                    idTokenHeader: header,
                    idTokenHeaderJson: headerJson,
                    idTokenExpiresAt: expiresAtMSec,
                };
                return result;
            }) 

    }
    
    /**
     * Returns the received claims about the user.
     */
    public getIdentityClaims(): object {
        var claims = this._storage.getItem("id_token_claims_obj");
        if (!claims) return null;
        return JSON.parse(claims);
    }
    
    /**
     * Returns the current id_token.
     */
    public getIdToken(): string {
        return this._storage.getItem("id_token");
    }
    
    private padBase64(base64data): string {
        while (base64data.length % 4 !== 0) {
            base64data += "=";
        }
        return base64data;
    }

    /**
     * Returns the current access_token.
     */
    public getAccessToken(): string {
        return this._storage.getItem("access_token");
    };

    /**
     * Returns the expiration date of the access_token
     * as milliseconds since 1970.
     */
    public getAccessTokenExpiration(): number {
        return parseInt(this._storage.getItem("expires_at"));
    }

    /**
     * Returns the expiration date of the id_token
     * as milliseconds since 1970.
     */
    public getIdTokenExpiration(): number {
        return parseInt(this._storage.getItem("id_token_expires_at"));
    }

    /**
     * Checkes, whether there is a valid access_token.
    */
    public hasValidAccessToken(): boolean {
        if (this.getAccessToken()) {

            var expiresAt = this._storage.getItem("expires_at");
            var now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };
    
    /**
     * Checkes, whether there is a valid id_token.
    */
    public hasValidIdToken(): boolean {
        if (this.getIdToken()) {

            var expiresAt = this._storage.getItem("id_token_expires_at");
            var now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };
    
    /**
     * Returns the auth-header that can be used
     * to transmit the access_token to a service
    */
    public authorizationHeader(): string {
        return "Bearer " + this.getAccessToken();
    }
    
    /**
     * Removes all tokens and logs the user out.
     * If a logout url is configured, the user is 
     * redirected to it.
     * @param noRedirectToLogoutUrl 
     */
    public logOut(noRedirectToLogoutUrl: boolean = false): void {
        var id_token = this.getIdToken();
        this._storage.removeItem("access_token");
        this._storage.removeItem("id_token");
        this._storage.removeItem("refresh_token");
        this._storage.removeItem("nonce");
        this._storage.removeItem("expires_at");
        this._storage.removeItem("id_token_claims_obj");
        this._storage.removeItem("id_token_expires_at");
        
        if (!this.logoutUrl) return;
        if (noRedirectToLogoutUrl) return;
        if (!id_token) return;

        let logoutUrl: string;
        
        if (!this.validateUrlForHttps(this.logoutUrl)) throw new Error('logoutUrl must use Http. Also check property requireHttps.');

        // For backward compatibility
        if (this.logoutUrl.indexOf('{{') > -1) {
            logoutUrl = this.logoutUrl.replace(/\{\{id_token\}\}/, id_token);
        }
        else {
            logoutUrl = this.logoutUrl + "?id_token_hint=" 
                                + encodeURIComponent(id_token)
                                + "&post_logout_redirect_uri="
                                + encodeURIComponent(this.postLogoutRedirectUri || this.redirectUri);
        }
        location.href = logoutUrl;
    };

    private createAndSaveNonce(): Promise<string> {
        var that = this;
        return this.createNonce().then(function (nonce: any) {
            that._storage.setItem("nonce", nonce);
            return nonce;
        })
    };

    protected createNonce(): Promise<string> {
        
        return new Promise((resolve, reject) => { 
        
            if (this.rngUrl) {
                throw new Error("createNonce with rng-web-api has not been implemented so far");
            }
            else {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < 40; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                
                resolve(text);
            }
        
        });
    };

    private checkAtHash(params: ValidationParams): boolean {
        
        if (!this.tokenValidationHandler) {
            console.warn('No tokenValidationHandler configured. Cannot check at_hash.');
            return true;
        }
        return this.tokenValidationHandler.validateAtHash(params);
    }

    private checkSignature(params: ValidationParams): Promise<any> {
        if (!this.tokenValidationHandler) {
            console.warn('No tokenValidationHandler configured. Cannot check signature.');
            return Promise.resolve(null);
        }
        return this.tokenValidationHandler.validateSignature(params);
    }

}
