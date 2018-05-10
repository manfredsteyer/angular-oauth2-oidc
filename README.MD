# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular.

![OIDC Certified Logo](https://raw.githubusercontent.com/manfredsteyer/angular-oauth2-oidc/master/oidc.png)

## Credits

- [generator-angular2-library](https://github.com/jvandemo/generator-angular2-library) for scaffolding an Angular library
- [jsrasign](https://kjur.github.io/jsrsasign/) for validating token signature and for hashing
- [Identity Server](https://github.com/identityserver) (used for testing with an .NET/.NET Core Backend)
- [Keycloak (Redhat)](http://www.keycloak.org/) for testing with Java

## Resources

- Sources and Sample:
https://github.com/manfredsteyer/angular-oauth2-oidc

- Source Code Documentation
https://manfredsteyer.github.io/angular-oauth2-oidc/angular-oauth2-oidc/docs/

## Tutorials

* [Angular Authentication with OpenID Connect and Okta in 20 Minutes](https://developer.okta.com/blog/2017/04/17/angular-authentication-with-oidc)
* [Add Authentication to Your Angular PWA](https://developer.okta.com/blog/2017/06/13/add-authentication-angular-pwa)
* [Build an Ionic App with User Authentication](https://developer.okta.com/blog/2017/08/22/build-an-ionic-app-with-user-authentication)

## Tested Environment

Successfully tested with Angular 4.3+, Angular 5 and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. At server side we've used IdentityServer (.NET/ .NET Core) and Redhat's Keycloak (Java).

## Release Cycle

- One major release for each Angular version
    - Will contain new features
    - Will contain bug fixes and PRs
- Critical Bugfixes on a regular basis

## New Features in Version 3.1

See [Release Notes](https://github.com/manfredsteyer/angular-oauth2-oidc/releases/tag/3.1)

## New Features in Version 3.0

See [Release Notes](https://github.com/manfredsteyer/angular-oauth2-oidc/releases/tag/3.0.1)

## New Features in Version 2.1
- New Config API (the original one is still supported)
- New convenience methods in OAuthService to streamline default tasks:
    - ``setupAutomaticSilentRefresh()``
    - ``loadDiscoveryDocumentAndTryLogin()``
- Single Sign out through Session Status Change Notification according to the OpenID Connect Session Management specs. This means, you can be notified when the user logs out using at the login provider.
- Possibility to define the ValidationHandler, the Config as well as the OAuthStorage via DI
- Better structured documentation

## New Features in Version 2
- Token Refresh for Implicit Flow by implementing "silent refresh"
- Validating the signature of the received id_token
- Providing Events via the observable ``events``.
- The event ``token_expires`` can be used together with a silent refresh to automatically refresh a token when/ before it expires (see also property ``timeoutFactor``).

## Additional Features 
- Logging in via OAuth2 and OpenId Connect (OIDC) Implicit Flow (where user is redirected to Identity Provider)
- "Logging in" via Password Flow (where user enters his/her password into the client)
- Token Refresh for Password Flow by using a Refresh Token
- Automatically refreshing a token when/ some time before it expires
- Querying Userinfo Endpoint
- Querying Discovery Document to ease configuration
- Validating claims of the id_token regarding the specs
- Hook for further custom validations
- Single-Sign-Out by redirecting to the auth-server's logout-endpoint

## Breaking Changes in Version 2
- The property ``oidc`` defaults to ``true``.
- If you are just using oauth2, you have to set ``oidc`` to ``false``. Otherwise, the validation of the user profile will fail!
- By default, ``sessionStorage`` is used. To use ``localStorage`` call method setStorage
- Demands using https as OIDC and OAuth2 relay on it. This rule can be relaxed using the property ``requireHttps``, e. g. for local testing.
- Demands that every url provided by the discovery document starts with the issuer's url. This can be relaxed by using the property ``strictDiscoveryDocumentValidation``.

## Sample-Auth-Server

You can use the OIDC-Sample-Server mentioned in the samples for Testing. It assumes, that your Web-App runns on http://localhost:8080.

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
import { OAuthModule } from 'angular-oauth2-oidc';
[...]

@NgModule({
  imports: [ 
    [...]
    HttpModule,
    OAuthModule.forRoot()
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    [...]
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

To configure the library the following sample uses the new configuration API introduced with Version 2.1.
Hence, The original API is still supported.

```TypeScript
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url of the Identity Provider
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/index.html',

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: 'spa-demo',

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email voucher',
}
```

Configure the OAuthService with this config object when the application starts up:

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
      this.configureWithNewConfigApi();
    }

    private configureWithNewConfigApi() {
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
        this.oauthService.initImplicitFlow();
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

If you don't want to display a login form that tells the user that they are redirected to the identity server, you can use the convenince function ``this.oauthService.loadDiscoveryDocumentAndLogin();`` instead of ``this.oauthService.loadDiscoveryDocumentAndTryLogin();`` when setting up the library. 

This directly redirects the user to the identity server if there are no valid tokens. 


### Calling a Web API with an Access Token

Pass this Header to the used method of the ``Http``-Service within an Instance of the class ``Headers``:

```TypeScript
var headers = new Headers({
    "Authorization": "Bearer " + this.oauthService.getAccessToken()
});
```

If you are using the new ``HttpClient``, use the class ``HttpHeaders`` instead:

```TypeScript
var headers = new HttpHeaders({
    "Authorization": "Bearer " + this.oauthService.getAccessToken()
});
```

Since 3.1 you can also automate this task by switching ``sendAccessToken`` on and by setting ``allowedUrls`` to an array with prefixes for the respective urls. Use lower case for the prefixes.

```TypeScript
OAuthModule.forRoot({
    resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true
    }
})
```

## Routing

If you use the ``PathLocationStrategy`` (which is on by default) and have a general catch-all-route (``path: '**'``) you should be fine. Otherwise look up the section ``Routing with the HashStrategy`` in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/angular-oauth2-oidc/docs/).

## More Documentation

See the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/angular-oauth2-oidc/docs/) for more information about this library.











