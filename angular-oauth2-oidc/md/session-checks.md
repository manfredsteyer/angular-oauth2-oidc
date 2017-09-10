# Session Checks

Beginning with version 2.1, you can receive a notification when the user signs out with the identity provider.
This is implemented as defined by the OpenID Connect Session Management 1.0 spec.

When this option is activated, the library also automatically ends your local session. This means, the current tokens
are deleted by calling ``logOut``. In addition to that, the library sends a session_terminated event, you can register
for to perform a custom action.

Please note that this option can only be used when also the identity provider in question supports it.

## Configuration

To activate the session checks that leads to the mentioned notifications, set the configuration property
``sessionChecksEnabled``:

```TypeScript
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',
  redirectUri: window.location.origin + '/index.html',
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
  clientId: 'spa-demo',
  scope: 'openid profile email voucher',

  // Activate Session Checks:
  sessionChecksEnabled: true,
}
```

## Events
To get notified, you can hook up for the event ``session_terminated``:

```TypeScript
this.oauthService.events.filter(e => e.type === 'session_terminated').subscribe(e => {
console.debug('Your session has been terminated!');
})
```