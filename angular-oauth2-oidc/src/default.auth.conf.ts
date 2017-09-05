import { AuthConfig } from './auth.config';

export const defaultConfig: AuthConfig = {
    clientId: '',
    redirectUri: '',
    postLogoutRedirectUri: '',
    loginUrl: '',
    scope: 'openid profile',
    oidc: true,
    requestAccessToken: true,
    issuer: '',
    logoutUrl: '',
    clearHashAfterLogin: true,
    showDebugInformation: false,
    silentRefreshRedirectUri: '',
    silentRefreshMessagePrefix: '',
    silentRefreshShowIFrame: false,
    siletRefreshTimeout: 1000 * 20,
    requireHttps: 'remoteOnly',
    strictDiscoveryDocumentValidation: true,
    silentRefreshIFrameName: 'angular-oauth-oidc-silent-refresh-iframe',
    timeoutFactor: 0.75,
    checkSessionPeriodic: false,
    checkSessionIntervall: 3 * 1000,
    checkSessionIFrameName: 'angular-oauth-oidc-check-session-iframe'
};
