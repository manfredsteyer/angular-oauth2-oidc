
export interface AuthConfig {

    /**
     * The client's id as registered with the auth server
     */
    clientId?: string;

    /**
     * The client's redirectUri as registered with the auth server
     */
    redirectUri?: string;

    /**
     * An optional second redirectUri where the auth server
     * redirects the user to after logging out.
     */
    postLogoutRedirectUri?: string;

    /**
     * The auth server's endpoint that allows to log
     * the user in when using implicit flow.
     */
    loginUrl?: string;

    /**
     * The requested scopes
     */
    scope?: string;

    /**
     * Defines whether to use OpenId Connect during
     * implicit flow. Defaults to true.
     */
    oidc?: boolean;

    /**
     * Defines whether to request a access token during
     * implicit flow. Defaults to true;
     */
    requestAccessToken?: boolean;

    /**
     * The issuer's uri.
     */
    issuer?: string;

    /**
     * The logout url.
     */
    logoutUrl?: string;

    /**
     * Defines whether to clear the hash fragment after logging in.
     */
    clearHashAfterLogin?: boolean;

    /**
     * Url of the token endpoint as defined by OpenId Connect and OAuth 2.
     */
    tokenEndpoint?: string;

    /**
     * Url of the userinfo endpoint as defined by OpenId Connect.
     */
    userinfoEndpoint?: string;

    /**
     * Defines whether additional debug information should
     * be shown at the console.
     */
    showDebugInformation?: boolean;

    /**
     * The redirect uri used when doing silent refresh.
     */
    silentRefreshRedirectUri?: string;

    silentRefreshMessagePrefix?: string;

    /**
     * Set this to true to display the iframe used for
     * silent refresh for debugging.
     */
    silentRefreshShowIFrame?: boolean;

    /**
     * Timeout for silent refresh.
     */
    siletRefreshTimeout?: number;

    /**
     * Some auth servers don't allow using password flow
     * w/o a client secreat while the standards do not
     * demand for it. In this case, you can set a password
     * here. As this passwort is exposed to the public
     * it does not bring additional security and is therefore
     * as good as using no password.
     */
    dummyClientSecret?: string;

    /**
     * Defines whether https is required.
     * The default value is remoteOnly which only allows
     * http for location, while every other domains need
     * to be used with https.
     */
    requireHttps?: boolean | 'remoteOnly';

    /**
     * Defines whether every url provided by the discovery
     * document has to start with the issuer's url.
     */
    strictDiscoveryDocumentValidation?: boolean;

    /**
     * JSON Web Key Set (https://tools.ietf.org/html/rfc7517)
     * with keys used to validate received id_tokens.
     * This is taken out of the disovery document. Can be set manually too.
     */
    jwks?: object;

    /**
     * Map with additional query parameter that are appended to
     * the request when initializing implicit flow.
     */
    customQueryParams?: object;

    silentRefreshIFrameName?: string;

    /**
     * Defines when the token_timeout event should be raised.
     * If you set this to the default value 0.75, the event
     * is triggered after 75% of the token's life time.
     */
    timeoutFactor?: number;

    /**
     * If true, the lib will try to check whether the user
     * is still logged in on a regular basis as described
     * in http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {boolean}
     */
    checkSessionPeriodic?: boolean;

    /**
     * Intervall in msec for checking the session
     * according to http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {number}
     */
    checkSessionIntervall?: number;

    /**
     * Url for the iframe used for session checks
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    checkSessionIFrameUrl?: string;

    /**
     * Name of the iframe to use for session checks
     * @type {number}
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    checkSessionIFrameName?: string;
}
