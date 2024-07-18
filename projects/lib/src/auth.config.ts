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
   * Defines whether to use 'redirectUri' as a replacement
   * of 'postLogoutRedirectUri' if the latter is not set.
   */
  public redirectUriAsPostLogoutRedirectUriFallback? = true;

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
   * Defines whether to request an access token during
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
   * Url of the revocation endpoint as defined by OpenId Connect and OAuth 2.
   */
  public revocationEndpoint?: string = null;

  /**
   * Names of known parameters sent out in the TokenResponse. https://tools.ietf.org/html/rfc6749#section-5.1
   */
  public customTokenParameters?: string[] = [];

  /**
   * Url of the userinfo endpoint as defined by OpenId Connect.
   */
  public userinfoEndpoint?: string = null;

  public responseType? = '';

  /**
   * Defines whether additional debug information should
   * be shown at the console. Note that in certain browsers
   * the verbosity of the console needs to be explicitly set
   * to include Debug level messages.
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
   * @deprecated use silentRefreshTimeout
   */
  public siletRefreshTimeout?: number = 1000 * 20;

  /**
   * Timeout for silent refresh.
   */
  public silentRefreshTimeout?: number = 1000 * 20;

  /**
   * Some auth servers don't allow using password flow
   * w/o a client secret while the standards do not
   * demand for it. In this case, you can set a password
   * here. As this password is exposed to the public
   * it does not bring additional security and is therefore
   * as good as using no password.
   */
  public dummyClientSecret? = '';

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
   */
  public sessionChecksEnabled? = false;

  /**
   * Interval in msec for checking the session
   * according to http://openid.net/specs/openid-connect-session-1_0.html#ChangeNotification
   */
  public sessionCheckIntervall? = 3 * 1000;

  /**
   * Url for the iframe used for session checks
   */
  public sessionCheckIFrameUrl?: string = null;

  /**
   * Name of the iframe to use for session checks
   */
  public sessionCheckIFrameName? = 'angular-oauth-oidc-check-session-iframe';

  /**
   * This property has been introduced to disable at_hash checks
   * and is indented for Identity Provider that does not deliver
   * an at_hash EVEN THOUGH its recommended by the OIDC specs.
   * Of course, when disabling these checks then we are bypassing
   * a security check which means we are more vulnerable.
   */
  public disableAtHashCheck? = false;

  /**
   * Defines wether to check the subject of a refreshed token after silent refresh.
   * Normally, it should be the same as before.
   */
  public skipSubjectCheck? = false;

  public useIdTokenHintForSilentRefresh? = false;

  /**
   * Defined whether to skip the validation of the issuer in the discovery document.
   * Normally, the discovey document's url starts with the url of the issuer.
   */
  public skipIssuerCheck? = false;

  /**
   * According to rfc6749 it is recommended (but not required) that the auth
   * server exposes the access_token's life time in seconds.
   * This is a fallback value for the case this value is not exposed.
   */
  public fallbackAccessTokenExpirationTimeInSec?: number;

  /**
   * final state sent to issuer is built as follows:
   * state = nonce + nonceStateSeparator + additional state
   * Default separator is ';' (encoded %3B).
   * In rare cases, this character might be forbidden or inconvenient to use by the issuer so it can be customized.
   */
  public nonceStateSeparator? = ';';

  /**
   * Set this to true to use HTTP BASIC auth for AJAX calls
   */
  public useHttpBasicAuth? = false;

  /**
   * The window of time (in seconds) to allow the current time to deviate when validating id_token's iat and exp values.
   */
  public clockSkewInSec?: number;

  /**
   * Decreases the Expiration time of tokens by this number of seconds
   */
  public decreaseExpirationBySec? = 0;

  /**
   * The interceptors waits this time span if there is no token
   */
  public waitForTokenInMsec? = 0;

  /**
   * Set this to true if you want to use silent refresh together with
   * code flow. As silent refresh is the only option for refreshing
   * with implicit flow, you don't need to explicitly turn it on in
   * this case.
   */
  public useSilentRefresh?;

  /**
   * Code Flow is by defauld used together with PKCI which is also higly recommented.
   * You can disbale it here by setting this flag to true.
   * https://tools.ietf.org/html/rfc7636#section-1.1
   */
  public disablePKCE? = false;

  /**
   * Set this to true to preserve the requested route including query parameters after code flow login.
   * This setting enables deep linking for the code flow.
   */
  public preserveRequestedRoute? = false;

  /**
   * Allows to disable the timer for the id_token used
   * for token refresh
   */
  public disableIdTokenTimer? = false;

  /**
   * Blocks other origins requesting a silent refresh
   */
  public checkOrigin? = false;

  /**
   * Allows to set prefix for entries stored in configured storage.
   * Can be used to avoid multipple apps overriding each other values
   */
  public configId? = '';

  constructor(json?: Partial<AuthConfig>) {
    if (json) {
      Object.assign(this, json);
    }
  }

  /**
   * This property allows you to override the method that is used to open the login url,
   * allowing a way for implementations to specify their own method of routing to new
   * urls.
   */
  public openUri?: (uri: string) => void = (uri) => {
    location.href = uri;
  };
}
