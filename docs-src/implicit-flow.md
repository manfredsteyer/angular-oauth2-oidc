## Configuring for Implicit Flow

This section shows how to implement login leveraging implicit flow. This is the OAuth2/OIDC flow which was originally intended for Single Page Application. 

Meanwhile using **Code Flow** instead is a **best practice** and with OAuth 2.1 implicit flow will be **deprecated***.

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

