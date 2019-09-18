/**
 * Additional options that can be passt to tryLogin.
 */
export class LoginOptions {
  /**
   * Is called, after a token has been received and
   * successfully validated.
   *
   * Deprecated:  Use property ``events`` on OAuthService instead.
   */
  onTokenReceived?: (receivedTokens: ReceivedTokens) => void;

  /**
   * Hook, to validate the received tokens.
   *
   * Deprecated:  Use property ``tokenValidationHandler`` on OAuthService instead.
   */
  validationHandler?: (receivedTokens: ReceivedTokens) => Promise<any>;

  /**
   * Called when tryLogin detects that the auth server
   * included an error message into the hash fragment.
   *
   * Deprecated:  Use property ``events`` on OAuthService instead.
   */
  onLoginError?: (params: object) => void;

  /**
   * A custom hash fragment to be used instead of the
   * actual one. This is used for silent refreshes, to
   * pass the iframes hash fragment to this method.
   */
  customHashFragment?: string;

  /**
   * Set this to true to disable the oauth2 state
   * check which is a best practice to avoid
   * security attacks.
   * As OIDC defines a nonce check that includes
   * this, this can be set to true when only doing
   * OIDC.
   */
  disableOAuth2StateCheck?: boolean;

  /**
   * Normally, you want to clear your hash fragment after
   * the lib read the token(s) so that they are not displayed
   * anymore in the url. If not, set this to true.
   */
  preventClearHashAfterLogin? = false;
}

/**
 * Defines the logging interface the OAuthService uses
 * internally. Is compatible with the `console` object,
 * but you can provide your own implementation as well
 * through dependency injection.
 */
export abstract class OAuthLogger {
  abstract debug(message?: any, ...optionalParams: any[]): void;
  abstract info(message?: any, ...optionalParams: any[]): void;
  abstract log(message?: any, ...optionalParams: any[]): void;
  abstract warn(message?: any, ...optionalParams: any[]): void;
  abstract error(message?: any, ...optionalParams: any[]): void;
}

/**
 * Defines a simple storage that can be used for
 * storing the tokens at client side.
 * Is compatible to localStorage and sessionStorage,
 * but you can also create your own implementations.
 */
export abstract class OAuthStorage {
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, data: string): void;
}

/**
 * Represents the received tokens, the received state
 * and the parsed claims from the id-token.
 */
export class ReceivedTokens {
  idToken: string;
  accessToken: string;
  idClaims?: object;
  state?: string;
}

/**
 * Represents the parsed and validated id_token.
 */
export interface ParsedIdToken {
  idToken: string;
  idTokenClaims: object;
  idTokenHeader: object;
  idTokenClaimsJson: string;
  idTokenHeaderJson: string;
  idTokenExpiresAt: number;
}

/**
 * Represents the response from the token endpoint
 * http://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint
 */
export interface TokenResponse {
  access_token: string;
  id_token: string; 
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  state?: string;
}

/**
 * Represents the response from the user info endpoint
 * http://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 */
export interface UserInfo {
  sub: string;
  [key: string]: any;
}

/**
 * Represents an OpenID Connect discovery document
 */
export interface OidcDiscoveryDoc {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  token_endpoint_auth_methods_supported: string[];
  token_endpoint_auth_signing_alg_values_supported: string[];
  userinfo_endpoint: string;
  check_session_iframe: string;
  end_session_endpoint: string;
  jwks_uri: string;
  registration_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  acr_values_supported: string[];
  response_modes_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  userinfo_signing_alg_values_supported: string[];
  userinfo_encryption_alg_values_supported: string[];
  userinfo_encryption_enc_values_supported: string[];
  id_token_signing_alg_values_supported: string[];
  id_token_encryption_alg_values_supported: string[];
  id_token_encryption_enc_values_supported: string[];
  request_object_signing_alg_values_supported: string[];
  display_values_supported: string[];
  claim_types_supported: string[];
  claims_supported: string[];
  claims_parameter_supported: boolean;
  service_documentation: string;
  ui_locales_supported: string[];
}
