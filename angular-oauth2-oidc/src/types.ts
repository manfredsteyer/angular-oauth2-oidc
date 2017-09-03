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
