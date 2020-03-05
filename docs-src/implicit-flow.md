## Configuring for Implicit Flow

This section shows how to implement login leveraging implicit flow. This is the OAuth2/OIDC flow best suitable for
Single Page Application. It sends the user to the Identity Provider's login page. After logging in, the SPA gets tokens.
This also allows for single sign on as well as single sign off.

To configure the library, the following sample uses the new configuration API introduced with Version 2.1.
Hence, the original API is still supported.

```TypeScript
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  // Url of the Identity Provider
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/index.html',

  // The SPA's id. The SPA is registered with this id at the auth-server
  clientId: 'spa-demo',

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email voucher',
}
```

Configure the ``OAuthService`` with this config object when the application starts up:

```TypeScript
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';
import { Component } from '@angular/core';

@Component({
    selector: 'flight-app',
    templateUrl: './app.component.html'
})
export class AppComponent {

    constructor(private oauthService: OAuthService) {
      this.configure();
    }

    private configure() {
      this.oauthService.configure(authConfig);
      this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.loadDiscoveryDocumentAndTryLogin();
    }
}
```

### Implementing a Login Form

After you've configured the library, you just have to call ``initImplicitFlow`` to login using OAuth2/ OIDC.

```TypeScript
import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
    templateUrl: "app/home.html"
})
export class HomeComponent {

    constructor(private oauthService: OAuthService) {
    }

    public login() {
        this.oauthService.initLoginFlow();
    }

    public logoff() {
        this.oauthService.logOut();
    }

    public get name() {
        let claims = this.oauthService.getIdentityClaims();
        if (!claims) return null;
        return claims.given_name;
    }

}
```

The following snippet contains the template for the login page:

```HTML
<h1 *ngIf="!name">
    Hallo
</h1>
<h1 *ngIf="name">
    Hallo, {{name}}
</h1>

<button class="btn btn-default" (click)="login()">
    Login
</button>
<button class="btn btn-default" (click)="logoff()">
    Logout
</button>

<div>
    Username/Passwort zum Testen: max/geheim
</div>
```

## Refreshing when using Implicit Flow (not Code Flow!)

To refresh your tokens when using implicit flow you can use a silent refresh. This is a well-known solution that compensates the fact that implicit flow does not allow for issuing a refresh token. It uses a hidden iframe to get another token from the auth server. When the user is there still logged in (by using a cookie) it will respond without user interaction and provide new tokens.

To use this approach, setup a redirect uri for the silent refresh.

For this, you can set the property silentRefreshRedirectUri in the config object:

```TypeScript
// This api will come in the next version

import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url of the Identity Provider
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/index.html',

  // URL of the SPA to redirect the user after silent refresh
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: 'spa-demo',

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email voucher',
}
```

As an alternative, you can set the same property directly with the OAuthService:

```TypeScript
this.oauthService.silentRefreshRedirectUri = window.location.origin + "/silent-refresh.html";
```

Please keep in mind that this uri has to be configured at the auth-server too.

This file is loaded into the hidden iframe after getting new tokens. Its only task is to send the received tokens to the main application:

```HTML
<html>
<body>
    <script>
    window.parent.postMessage(location.hash || ('#' + location.search), location.origin);
    </script>
</body>
</html>
```

Please make sure that this file is copied to your output directory by your build task. When using the CLI you can define it as an asset for this. For this, you have to add the following line to the file ``.angular-cli.json``:

```JSON
"assets": [
    [...],
    "silent-refresh.html"
],
```

To perform a silent refresh, just call the following method:

```TypeScript
this
    .oauthService
    .silentRefresh()
    .then(info => console.debug('refresh ok', info))
    .catch(err => console.error('refresh error', err));
```

When there is an error in the iframe that prevents the communication with the main application, silentRefresh will give you a timeout. To configure the timespan for this, you can set the property ``silentRefreshTimeout`` (msec). The default value is 20.000 (20 seconds).

### Automatically refreshing a token when/ before it expires (Code Flow and Implicit Flow)


To automatically refresh a token when/ some time before it expires, just call the following method after configuring the OAuthService:

```TypeScript
this.oauthService.setupAutomaticSilentRefresh();
```

By default, this event is fired after 75% of the token's life time is over. You can adjust this factor by setting the property ``timeoutFactor`` to a value between 0 and 1. For instance, 0.5 means, that the event is fired after half of the life time is over and 0.33 triggers the event after a third.