# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular.

![OIDC Certified Logo](https://raw.githubusercontent.com/manfredsteyer/angular-oauth2-oidc/master/oidc.png)

## Credits

- [generator-angular2-library](https://github.com/jvandemo/generator-angular2-library) for scaffolding an Angular library
- [jsrasign](https://kjur.github.io/jsrsasign/) until version 5: For validating token signature and for hashing; beginning with version 6, we are using browser APIs to minimize our bundle size
- [Identity Server](https://github.com/identityserver) (used for testing with an .NET/.NET Core Backend)
- [Keycloak (Redhat)](http://www.keycloak.org/) for testing with Java

## Resources

- Sources and Sample:
https://github.com/manfredsteyer/angular-oauth2-oidc

- Source Code Documentation
https://manfredsteyer.github.io/angular-oauth2-oidc/docs

## Tested Environment

Successfully tested with **Angular 7** and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. At server side we've used IdentityServer (.NET/ .NET Core) and Redhat's Keycloak (Java).

**Angular 6**: Use Version 4.x of this library. Version 4.x was tested with Angular 6. You can also try the newer version 5.x of this library which has a much smaller bundle size.

**Angular 5.x or 4.3**: If you need support for Angular < 6 (4.3 to 5.x) you can download the former version 3.1.4 (npm i angular-oauth2-oidc@^3 --save).

## Release Cycle

- We plan one major release for each Angular version
    - Will contain new features
    - Will contain bug fixes and PRs
- Critical Bugfixes on demand

## Contributions
- Feel free to file pull requests
- The closed issues contain some ideas for PRs and enhancements (see labels)
- If you want to contribute to the docs, you can do so in the `docs-src` folder. Make sure you update `summary.json` as well. Then generate the docs with the following commands:

  ```
  npm install -g @compodoc/compodoc
  npm run docs
  ```

# Features 
- Logging in via Implicit Flow (where a user is redirected to Identity Provider)
- Logging in via Code Flow + PKCE
- "Logging in" via Password Flow (where a user enters their password into the client)
- Token Refresh for all supported flows
- Automatically refreshing a token when/some time before it expires
- Querying Userinfo Endpoint
- Querying Discovery Document to ease configuration
- Validating claims of the id_token regarding the specs
- Hook for further custom validations
- Single-Sign-Out by redirecting to the auth-server's logout-endpoint

## Sample-Auth-Server

You can use the OIDC-Sample-Server mentioned in the samples for Testing. It assumes, that your Web-App runs on http://localhost:8080.

Username/Password: max/geheim

*clientIds:* 
- spa-demo (implicit flow)
- demo-resource-owner (resource owner password flow)

*redirectUris:*
- localhost:[8080-8089|4200-4202]
- localhost:[8080-8089|4200-4202]/index.html
- localhost:[8080-8089|4200-4202]/silent-refresh.html

## Installing

```
npm i angular-oauth2-oidc --save
```

## Importing the NgModule

```TypeScript
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule } from 'angular-oauth2-oidc';
// etc.

@NgModule({
  imports: [ 
    // etc.
    HttpClientModule,
    OAuthModule.forRoot()
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    // etc.
  ],
  bootstrap: [
    AppComponent 
  ]
})
export class AppModule {
}
``` 

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

### Skipping the Login Form

If you don't want to display a login form that tells the user that they are redirected to the identity server, you can use the convenience function ``this.oauthService.loadDiscoveryDocumentAndLogin();`` instead of ``this.oauthService.loadDiscoveryDocumentAndTryLogin();`` when setting up the library. 

This directly redirects the user to the identity server if there are no valid tokens. 


### Calling a Web API with an Access Token

You can automate this task by switching ``sendAccessToken`` on and by setting ``allowedUrls`` to an array with prefixes for the respective URLs. Use lower case for the prefixes.

```TypeScript
OAuthModule.forRoot({
    resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true
    }
})
```

If you need more versatility, you can look in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/working-with-httpinterceptors.html) how to setup a custom interceptor.

## Code Flow + PKCE

See docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/code-flow-+-pcke.html

## Token Refresh

See docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/refreshing-a-token.html

## Routing

If you use the ``PathLocationStrategy`` (which is on by default) and have a general catch-all-route (``path: '**'``) you should be fine. Otherwise look up the section ``Routing with the HashStrategy`` in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/).

## More Documentation (!)

See the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/) for more information about this library.

## Tutorials

* [Tutorial with Demo Servers available online](https://www.softwarearchitekt.at/post/2016/07/03/authentication-in-angular-2-with-oauth2-oidc-and-guards-for-the-newest-new-router-english-version.aspx)
* [Angular Authentication with OpenID Connect and Okta in 20 Minutes](https://developer.okta.com/blog/2017/04/17/angular-authentication-with-oidc)
* [Add Authentication to Your Angular PWA](https://developer.okta.com/blog/2017/06/13/add-authentication-angular-pwa)
* [Build an Ionic App with User Authentication](https://developer.okta.com/blog/2017/08/22/build-an-ionic-app-with-user-authentication)
* [On-Site Workshops](https://www.softwarearchitekt.at)








