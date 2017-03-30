import { Base64 } from 'js-base64';
import { fromByteArray } from 'base64-js';
import * as _sha256 from 'sha256';
import { Http, URLSearchParams, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import * as moment from 'moment';

let sha256: any = _sha256;

@Injectable()
export class OAuthService {

    public clientId = '';
    public redirectUri = '';
    public loginUrl = '';
    public scope = '';
    public resource = '';
    public rngUrl = '';
    public oidc = false;
    public options: any;
    public state = '';
    public issuer = '';
    public validationHandler: any;
    public logoutUrl = '';
    public clearHashAfterLogin: boolean = true;
    public tokenEndpoint: string;
    public userinfoEndpoint: string;
    public revocationEndpoint: string;
    public dummyClientSecret: string;
    public autoRefreshToken: boolean = false;

    public discoveryDocumentLoaded: boolean = false;
    public discoveryDocumentLoaded$: Observable<any>;
    private discoveryDocumentLoadedSender: Observer<any>;

    private grantTypesSupported: Array<string> = [];

    private _storage: Storage = localStorage;

    private TOKEN_REFRESH_WHEN_X_SECONDS_LEFT = 30;
    private refreshTimeout: any;

    public setStorage(storage: Storage) {
        this._storage = storage;
    }

    constructor(private http: Http) {
        this.discoveryDocumentLoaded$ = Observable.create(sender => {
            this.discoveryDocumentLoadedSender = sender;
        }).publish().connect();
    }

    loadDiscoveryDocument(fullUrl: string = null): Promise<any> {

        return new Promise((resolve, reject) => {

            if (!fullUrl) {
                fullUrl = this.issuer + '/.well-known/openid-configuration';
            }

            this.http.get(fullUrl).map(r => r.json()).subscribe(
                (doc) => {

                    this.loginUrl = doc.authorization_endpoint;
                    this.logoutUrl = doc.end_session_endpoint;
                    this.grantTypesSupported = doc.grant_types_supported;
                    this.issuer = doc.issuer;
                    // this.jwks_uri = this.jwks_uri;
                    this.tokenEndpoint = doc.token_endpoint;
                    this.userinfoEndpoint = doc.userinfo_endpoint;
                    this.revocationEndpoint = doc.revocation_endpoint;

                    this.discoveryDocumentLoaded = true;
                    this.discoveryDocumentLoadedSender.next(doc);
                    resolve(doc);
                },
                (err) => {
                    console.error('error loading dicovery document', err);
                    reject(err);
                }
            );
        });

    }

    fetchTokenUsingPasswordFlowAndLoadUserProfile(userName: string, password: string) {
        return this
            .fetchTokenUsingPasswordFlow(userName, password)
            .then(() => this.loadUserProfile());
    }

    loadUserProfile() {
        if (!this.hasValidAccessToken()) { throw Error('Can not load User Profile without access_token'); }

        return new Promise((resolve, reject) => {

            let headers = new Headers();
            headers.set('Authorization', 'Bearer ' + this.getAccessToken());

            this.http.get(this.userinfoEndpoint, { headers }).map(r => r.json()).subscribe(
                (doc) => {
                    console.debug('userinfo received', doc);
                    this._storage.setItem('id_token_claims_obj', JSON.stringify(doc));
                    resolve(doc);
                },
                (err) => {
                    console.error('error loading user info', err);
                    reject(err);
                }
            );
        });


    }

    fetchTokenUsingPasswordFlow(userName: string, password: string) {

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

            let headers = new Headers();
            headers.set('Content-Type', 'application/x-www-form-urlencoded');

            let params = search.toString();

            this.http.post(this.tokenEndpoint, params, { headers }).map(r => r.json()).subscribe(
                (tokenResponse) => {
                    console.debug('tokenResponse', tokenResponse);
                    this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in);

                    if (this.autoRefreshToken) {
                        this.startRefreshTimer();
                    }

                    resolve(tokenResponse);
                },
                (err) => {
                    console.error('Error performing password flow', err);
                    reject(err);
                }
            );
        });

    }

    revokeToken() {
        return new Promise((resolve, reject) => {
            let search = new URLSearchParams();
            search.set('token_type_hint', 'refresh_token');
            search.set('client_id', this.clientId);
            search.set('token', this._storage.getItem('refresh_token'));

            if (this.dummyClientSecret) {
                search.set('client_secret', this.dummyClientSecret);
            }

            let headers = new Headers();
            headers.set('Content-Type', 'application/x-www-form-urlencoded');

            let params = search.toString();
            this.logOut(true);
            this.http.post(this.revocationEndpoint, params, { headers }).subscribe(
                () => {
                    console.debug('token revoked');
                    resolve();
                },
                (err) => {
                    console.error('Error performing token revocation', err);
                    reject(err);
                }
            );
        });
    }


    refreshToken() {

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
                    console.debug('refresh tokenResponse', tokenResponse);
                    this.storeAccessTokenResponse(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_in);

                    if (this.autoRefreshToken) {
                        this.startRefreshTimer();
                    }

                    resolve(tokenResponse);
                },
                (err) => {
                    console.error('Error performing password flow', err);
                    reject(err);
                }
            );
        });

    }



    calculateRefreshTimeOut() {

        let tokenExpiresAt = moment(parseInt(this._storage.getItem('expires_at')));

        let timeout = tokenExpiresAt.diff(moment()) - (this.TOKEN_REFRESH_WHEN_X_SECONDS_LEFT * 1000);

        console.debug('JWT Access Token expires at ' + tokenExpiresAt.format('HH:mm:ss'));
        console.debug('Will refresh JWT token in ' + (timeout / 1000) + ' seconds (at ' + moment().add(timeout, 'milliseconds').format('HH:mm:ss') + ')');

        return timeout;
    }

    startRefreshTimer() {
        let interval = this.calculateRefreshTimeOut();
        if (interval > 0) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(() => { this.refreshToken(); }, interval);
        }
    }
    stopRefreshTimer() {
        clearTimeout(this.refreshTimeout);
    }

    createLoginUrl(state) {
        let that = this;

        if (typeof state === 'undefined') { state = ''; }

        return this.createAndSaveNonce().then(function (nonce: any) {

            if (state) {
                state = nonce + ';' + state;
            } else {
                state = nonce;
            }

            let response_type = 'token';

            if (that.oidc) {
                response_type = 'id_token+token';
            }

            let url = that.loginUrl
                + '?response_type='
                + response_type
                + '&client_id='
                + encodeURIComponent(that.clientId)
                + '&state='
                + encodeURIComponent(state)
                + '&redirect_uri='
                + encodeURIComponent(that.redirectUri)
                + '&scope='
                + encodeURIComponent(that.scope);

            if (that.resource) {
                url += '&resource=' + encodeURIComponent(that.resource);
            }

            if (that.oidc) {
                url += '&nonce=' + encodeURIComponent(nonce);
            }

            return url;
        });
    };

    initImplicitFlow(additionalState = '') {
        this.createLoginUrl(additionalState).then(function (url) {
            location.href = url;
        })
            .catch(function (error) {
                console.error('Error in initImplicitFlow');
                console.error(error);
            });
    };

    callEventIfExists(options: any) {
        let that = this;
        if (options.onTokenReceived) {
            let tokenParams = {
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state
            };
            options.onTokenReceived(tokenParams);
        }
    }

    private storeAccessTokenResponse(accessToken: string, refreshToken: string, expiresIn: number) {
        this._storage.setItem('access_token', accessToken);

        if (expiresIn) {
            let expiresInMilliSeconds = expiresIn * 1000;
            let now = new Date();
            let expiresAt = now.getTime() + expiresInMilliSeconds;
            this._storage.setItem('expires_at', '' + expiresAt);
        }

        if (refreshToken) {
            this._storage.setItem('refresh_token', refreshToken);
        }
    }

    tryLogin(options) {

        options = options || {};


        let parts = this.getFragment();

        let accessToken = parts['access_token'];
        let idToken = parts['id_token'];
        let state = parts['state'];

        let oidcSuccess = false;
        let oauthSuccess = false;

        if (!accessToken || !state) { return false; }
        if (this.oidc && !idToken) { return false; }

        let savedNonce = this._storage.getItem('nonce');

        let stateParts = state.split(';');
        let nonceInState = stateParts[0];
        if (savedNonce === nonceInState) {

            this.storeAccessTokenResponse(accessToken, null, parts['expires_in']);

            if (stateParts.length > 1) {
                this.state = stateParts[1];
            }

            oauthSuccess = true;

        }

        if (!oauthSuccess) { return false; }

        if (this.oidc) {
            oidcSuccess = this.processIdToken(idToken, accessToken);
            if (!oidcSuccess) { return false; }
        }

        if (options.validationHandler) {

            let validationParams = { accessToken: accessToken, idToken: idToken };

            options
                .validationHandler(validationParams)
                .then(() => {
                    this.callEventIfExists(options);
                })
                .catch(function (reason) {
                    console.error('Error validating tokens');
                    console.error(reason);
                });
        } else {
            this.callEventIfExists(options);
        }

        // NEXT VERSION: Notify parent-window (iframe-refresh)
        /*
        var win = window;
        if (win.parent && win.parent.onOAuthCallback) {
            win.parent.onOAuthCallback(this.state);
        }            
        */

        if (this.clearHashAfterLogin) { location.hash = ''; }

        if (this.autoRefreshToken) {
            this.startRefreshTimer();
        }

        return true;
    };

    processIdToken(idToken, accessToken) {
        let tokenParts = idToken.split('.');
        let claimsBase64 = this.padBase64(tokenParts[1]);
        let claimsJson = Base64.decode(claimsBase64);
        let claims = JSON.parse(claimsJson);
        let savedNonce = this._storage.getItem('nonce');

        if (Array.isArray(claims.aud)) {
            if (claims.aud.every(v => v !== this.clientId)) {
                console.warn('Wrong audience: ' + claims.aud.join(','));
                return false;
            }
        } else {
            if (claims.aud !== this.clientId) {
                console.warn('Wrong audience: ' + claims.aud);
                return false;
            }
        }

        if (this.issuer && claims.iss !== this.issuer) {
            console.warn('Wrong issuer: ' + claims.iss);
            return false;
        }

        if (claims.nonce !== savedNonce) {
            console.warn('Wrong nonce: ' + claims.nonce);
            return false;
        }

        if (accessToken && !this.checkAtHash(accessToken, claims)) {
            console.warn('Wrong at_hash');
            return false;
        }

        // Das Prüfen des Zertifikates wird der Serverseite überlassen!

        let now = Date.now();
        let issuedAtMSec = claims.iat * 1000;
        let expiresAtMSec = claims.exp * 1000;

        let tenMinutesInMsec = 1000 * 60 * 10;

        if (issuedAtMSec - tenMinutesInMsec >= now || expiresAtMSec + tenMinutesInMsec <= now) {
            console.warn('Token has been expired');
            console.warn({
                now: now,
                issuedAtMSec: issuedAtMSec,
                expiresAtMSec: expiresAtMSec
            });
            return false;
        }

        this._storage.setItem('id_token', idToken);
        this._storage.setItem('id_token_claims_obj', claimsJson);
        this._storage.setItem('id_token_expires_at', '' + expiresAtMSec);

        if (this.validationHandler) {
            this.validationHandler(idToken);
        }

        return true;
    }

    getIdentityClaims() {
        let claims = this._storage.getItem('id_token_claims_obj');
        if (!claims) { return null; }
        return JSON.parse(claims);
    }

    getIdToken() {
        return this._storage.getItem('id_token');
    }

    padBase64(base64data) {
        while (base64data.length % 4 !== 0) {
            base64data += '=';
        }
        return base64data;
    }

    tryLoginWithIFrame() {
        throw new Error('tryLoginWithIFrame has not been implemented so far');
    };

    tryRefresh(timeoutInMsec) {
        throw new Error('tryRefresh has not been implemented so far');
    };

    getAccessToken() {
        return this._storage.getItem('access_token');
    };

    hasValidAccessToken() {
        if (this.getAccessToken()) {

            let expiresAt = this._storage.getItem('expires_at');
            let now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };

    hasValidIdToken() {
        if (this.getIdToken()) {

            let expiresAt = this._storage.getItem('id_token_expires_at');
            let now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };

    authorizationHeader() {
        return 'Bearer ' + this.getAccessToken();
    }

    logOut(noRedirectToLogoutUrl: boolean = false) {

        if (this.autoRefreshToken) {
            this.stopRefreshTimer();
        }

        let id_token = this.getIdToken();
        this._storage.removeItem('access_token');
        this._storage.removeItem('id_token');
        this._storage.removeItem('refresh_token');
        this._storage.removeItem('nonce');
        this._storage.removeItem('expires_at');
        this._storage.removeItem('id_token_claims_obj');
        this._storage.removeItem('id_token_expires_at');

        if (!this.logoutUrl) { return; }
        if (noRedirectToLogoutUrl) { return; }

        let logoutUrl: string;

        // For backward compatibility
        if (this.logoutUrl.indexOf('{{') > -1) {
            logoutUrl = this.logoutUrl.replace(/\{\{id_token\}\}/, id_token);
        } else {
            logoutUrl = this.logoutUrl + '?id_token_hint='
                + encodeURIComponent(id_token)
                + '&post_logout_redirect_uri='
                + encodeURIComponent(this.redirectUri);
        }
        location.href = logoutUrl;
    };

    createAndSaveNonce() {
        let that = this;
        return this.createNonce().then(function (nonce: any) {
            that._storage.setItem('nonce', nonce);
            return nonce;
        });
    };

    createNonce() {

        return new Promise((resolve, reject) => {

            if (this.rngUrl) {
                throw new Error('createNonce with rng-web-api has not been implemented so far');
            } else {
                let text = '';
                let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                for (let i = 0; i < 40; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                resolve(text);
            }

        });
    };

    getFragment() {
        if (window.location.hash.indexOf('#') === 0) {
            return this.parseQueryString(window.location.hash.substr(1));
        } else {
            return {};
        }
    };

    parseQueryString(queryString) {
        let data = {}, pairs, pair, separatorIndex, escapedKey, escapedValue, key, value;

        if (queryString === null) {
            return data;
        }

        pairs = queryString.split('&');

        for (let i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            separatorIndex = pair.indexOf('=');

            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            } else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }

            key = decodeURIComponent(escapedKey);
            value = decodeURIComponent(escapedValue);

            if (key.substr(0, 1) === '/') {
                key = key.substr(1);
            }

            data[key] = value;
        }

        return data;
    };



    checkAtHash(accessToken, idClaims) {
        if (!accessToken || !idClaims || !idClaims.at_hash) { return true; }
        let tokenHash: Array<any> = sha256(accessToken, { asBytes: true });
        let leftMostHalf = tokenHash.slice(0, (tokenHash.length / 2));
        let tokenHashBase64 = fromByteArray(leftMostHalf);
        let atHash = tokenHashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        let claimsAtHash = idClaims.at_hash.replace(/=/g, '');

        if (atHash !== claimsAtHash) {
            console.warn('exptected at_hash: ' + atHash);
            console.warn('actual at_hash: ' + claimsAtHash);
        }

        return (atHash === claimsAtHash);
    }

}
