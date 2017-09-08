
export class AuthConfig {
    /**
     * The client's id as registered with the auth server
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public clientId? = '';

    /**
     * The client's redirectUri as registered with the auth server
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public redirectUri? = '';

    /**
     * An optional second redirectUri where the auth server
     * redirects the user to after logging out.
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public postLogoutRedirectUri? = '';

    /**
     * The auth server's endpoint that allows to log
     * the user in when using implicit flow.
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     *
     */
    public loginUrl? = '';

    /**
     * The requested scopes
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     *
     */
    public scope? = 'openid profile';

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public resource? = '';

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public rngUrl? = '';

    /**
     * Defines whether to use OpenId Connect during
     * implicit flow.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public oidc? = true;

    /**
     * Defines whether to request a access token during
     * implicit flow.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public requestAccessToken? = true;

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public options?: any;

    /**
     * The issuer's uri.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public issuer? = '';

    /**
     * The logout url.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public logoutUrl? = '';

    /**
     * Defines whether to clear the hash fragment after logging in.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public clearHashAfterLogin? = true;

    /**
     * Url of the token endpoint as defined by OpenId Connect and OAuth 2.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public tokenEndpoint?: string;

    /**
     * Url of the userinfo endpoint as defined by OpenId Connect.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     *
     */
    public userinfoEndpoint?: string;

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public responseType? = 'token';

    /**
     * Defines whether additional debug information should
     * be shown at the console.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public showDebugInformation? = false;

    /**
     * The redirect uri used when doing silent refresh.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public silentRefreshRedirectUri? = '';

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public silentRefreshMessagePrefix? = '';

    /**
     * Set this to true to display the iframe used for
     * silent refresh for debugging.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public silentRefreshShowIFrame? = false;

    /**
     * Timeout for silent refresh.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public siletRefreshTimeout?: number = 1000 * 20;

    /**
     * Some auth servers don't allow using password flow
     * w/o a client secreat while the standards do not
     * demand for it. In this case, you can set a password
     * here. As this passwort is exposed to the public
     * it does not bring additional security and is therefore
     * as good as using no password.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public dummyClientSecret?: string;


    /**
     * Defines whether https is required.
     * The default value is remoteOnly which only allows
     * http for location, while every other domains need
     * to be used with https.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public requireHttps?: boolean | 'remoteOnly' = 'remoteOnly';

    /**
     * Defines whether every url provided by the discovery
     * document has to start with the issuer's url.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public strictDiscoveryDocumentValidation? = true;

    /**
     * JSON Web Key Set (https://tools.ietf.org/html/rfc7517)
     * with keys used to validate received id_tokens.
     * This is taken out of the disovery document. Can be set manually too.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public jwks?: object;

    /**
     * Map with additional query parameter that are appended to
     * the request when initializing implicit flow.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public customQueryParams?: object;

    /**
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public silentRefreshIFrameName? = 'angular-oauth-oidc-silent-refresh-iframe';

    /**
     * Defines when the token_timeout event should be raised.
     * If you set this to the default value 0.75, the event
     * is triggered after 75% of the token's life time.
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public timeoutFactor? = 0.75;

    /**
     * If true, the lib will try to check whether the user
     * is still logged in on a regular basis as described
     * in http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {boolean}
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public sessionChecksEnabled? = false;

    /**
     * Intervall in msec for checking the session
     * according to http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
     * @type {number}
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public sessionCheckIntervall? = 3 * 1000;

    /**
     * Url for the iframe used for session checks
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
     */
    public sessionCheckIFrameUrl?: string;

    /**
     * Name of the iframe to use for session checks
     * @type {number}
     *
     * @internal DEPREACTED/ LEGACY. Use method configure instead.
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
}
