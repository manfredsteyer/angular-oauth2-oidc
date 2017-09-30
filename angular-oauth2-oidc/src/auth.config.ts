
export class AuthConfig {
    /**
     * The client's id as registered with the auth server
     */
    public clientId? = '';

    /**
     * The client's redirectUri as registered with the auth server
     */
    public redirectUri? = '';

    /**
     * An optional second redirectUri where the auth server
     * redirects the user to after logging out.
     */
    public postLogoutRedirectUri? = '';

    /**
     * The auth server's endpoint that allows to log
     * the user in when using implicit flow.
     */
    public loginUrl? = '';

    /**
     * The requested scopes
     */
    public scope? = 'openid profile';

    public resource? = '';

    public rngUrl? = '';

    /**
     * Defines whether to use OpenId Connect during
     * implicit flow.
     */
    public oidc? = true;

    /**
     * Defines whether to request a access token during
     * implicit flow.
     */
    public requestAccessToken? = true;

    public options?: any = null;

    /**
     * The issuer's uri.
     */
    public issuer? = '';

    /**
     * The logout url.
     */
    public logoutUrl? = '';

    /**
     * Defines whether to clear the hash fragment after logging in.
     */
    public clearHashAfterLogin? = true;

    /**
     * Url of the token endpoint as defined by OpenId Connect and OAuth 2.
     */
    public tokenEndpoint?: string = null;

    /**
     * Url of the userinfo endpoint as defined by OpenId Connect.
     *
     */
    public userinfoEndpoint?: string = null;

    public responseType? = 'token';

    /**
     * Defines whether additional debug information should
     * be shown at the console.
     */
    public showDebugInformation? = false;

    /**
     * The redirect uri used when doing silent refresh.
     */
    public silentRefreshRedirectUri? = '';

    public silentRefreshMessagePrefix? = '';

    /**
     * Set this to true to display the iframe used for
     * silent refresh for debugging.
     */
    public silentRefreshShowIFrame? = false;

    /**
     * Timeout for silent refresh.
     * @internal
     * depreacted b/c of typo, see silentRefreshTimeout
     */
    public siletRefreshTimeout?: number = 1000 * 20;

    /**
     * Timeout for silent refresh.
     */
    public silentRefreshTimeout?: number = 1000 * 20;

    /**
     * Some auth servers don't allow using password flow
     * w/o a client secreat while the standards do not
     * demand for it. In this case, you can set a password
     * here. As this passwort is exposed to the public
     * it does not bring additional security and is therefore
     * as good as using no password.
     */
    public dummyClientSecret?: string = null;;


    /**
     * Defines whether https is required.
     * The default value is remoteOnly which only allows
     * http for localhost, while every other domains need
     * to be used with https.
     */
    public requireHttps?: boolean | 'remoteOnly' = 'remoteOnly';

    /**
     * Defines whether every url provided by the discovery
     * document has to start with the issuer's url.
     */
    public strictDiscoveryDocumentValidation? = true;

    /**
     * JSON Web Key Set (https://tools.ietf.org/html/rfc7517)
     * with keys used to validate received id_tokens.
     * This is taken out of the disovery document. Can be set manually too.
     */
    public jwks?: object = null;

    /**
     * Map with additional query parameter that are appended to
     * the request when initializing implicit flow.
     */
    public customQueryParams?: object = null;

    public silentRefreshIFrameName? = 'angular-oauth-oidc-silent-refresh-iframe';

    /**
     * Defines when the token_timeout event should be raised.
     * If you set this to the default value 0.75, the event
     * is triggered after 75% of the token's life time.
     */
    public timeoutFactor? = 0.75;

    /**
     * If true, the lib will try to check whether the user
     * is still logged in on a regular basis as described
     * in http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {boolean}
     */
    public sessionChecksEnabled? = false;

    /**
     * Intervall in msec for checking the session
     * according to http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {number}
     */
    public sessionCheckIntervall? = 3 * 1000;

    /**
     * Url for the iframe used for session checks
     */
    public sessionCheckIFrameUrl?: string = null;

    /**
     * Name of the iframe to use for session checks
     * @type {number}
     */
    public sessionCheckIFrameName? = 'angular-oauth-oidc-check-session-iframe';

    /**
     * This property has been introduced to disable at_hash checks
     * and is indented for Identity Provider that does not deliver
     * an at_hash EVEN THOUGH its recommended by the OIDC specs.
     * Of course, when disabling these checks the we are bypassing
     * a security check which means we are more vulnerable.
     */
    public disableAtHashCheck? = false;


    public skipSubjectCheck? = false;
}
