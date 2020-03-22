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

## Refresh

Please note that the lib performs a token refresh when the session changes to get the newest information about the current session. When using implicit flow, this means you have to configure [silent refresh](./silent-refresh.html); when using code flow you either need silent refresh or a [refresh token](./refreshing-a-token.html).

If using refresh tokens, your Auth Server needs to bind them to the current session's lifetime. Unfortunately, the used version of Identity Server 4, shown in the docs and in the example applications, does not support this at the moment.

## Events
To get notified, you can hook up for the event ``session_terminated``:

```TypeScript
this.oauthService.events.pipe(filter(e => e.type === 'session_terminated')).subscribe(e => {
  console.debug('Your session has been terminated!');
})
```
