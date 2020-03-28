import { AuthConfig } from 'angular-oauth2-oidc';
import { useSilentRefreshForCodeFlow } from '../flags';

export const authCodeFlowConfig: AuthConfig = {
  issuer: 'https://idsvr4.azurewebsites.net',

  // URL of the SPA to redirect the user to after login
  redirectUri:
    window.location.origin +
    (localStorage.getItem('useHashLocationStrategy') === 'true'
      ? '/#/index.html'
      : '/index.html'),

  // The SPA's id. The SPA is registerd with this id at the auth-server
  // clientId: 'server.code',
  clientId: 'spa',

  // Just needed if your auth server demands a secret. In general, this
  // is a sign that the auth server is not configured with SPAs in mind
  // and it might not enforce further best practices vital for security
  // such applications.
  // dummyClientSecret: 'secret',

  responseType: 'code',

  // set the scope for the permissions the client should request
  // The first four are defined by OIDC.
  // Important: Request offline_access to get a refresh token
  // The api scope is a usecase specific one
  scope: useSilentRefreshForCodeFlow
    ? 'openid profile email api'
    : 'openid profile email offline_access api',

  // ^^ Please note that offline_access is not needed for silent refresh
  // At least when using idsvr, this even prevents silent refresh
  // as idsvr ALWAYS prompts the user for consent when this scope is
  // requested

  // This is needed for silent refresh (refreshing tokens w/o a refresh_token)
  // **AND** for logging in with a popup
  silentRefreshRedirectUri: `${window.location.origin}/silent-refresh.html`,

  useSilentRefresh: useSilentRefreshForCodeFlow,

  showDebugInformation: true,

  sessionChecksEnabled: true,

  timeoutFactor: 0.01,
  // disablePKCI: true,

  clearHashAfterLogin: false
};
