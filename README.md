# @arroyo/ngx-oauth-oidc

Angular library for OAuth and OIDC Workflows.

This project is supported and maintained by [Arroyo Networks](https://arroyonetworks.com).
Contributors are welcome!

**This project is still incubating. Please refain from using until it is graduated from the 0.x.x release**

## Supported Angular Versions

**1.0.0**
- Angular 6
- Angular 7 

# Features 

## Support Grants:

- **Authorization Code (with PKCE)**
- Implicit
- Resource Owner Credentials

## Noteworthy:
  
- Token Refresh for Password Flow by using a Refresh Token
- Automatically Refreshing of Tokens
- Querying Userinfo Endpoint
- Querying Discovery Document for Auto-configuration
- Validating Claims of `id_token`
- Custom Token Validation Hooks

<!--
# Tested Environment

Successfully tested with **Angular 7** and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. At server side we've used IdentityServer (.NET/ .NET Core) and Redhat's Keycloak (Java).

**Angular 6**: Use Version 4.x of this library. Version 4.x was tested with Angular 6. You can also try the newer version 5.x of this library which has a much smaller bundle size.

**Angular 5.x or 4.3**: If you need support for Angular < 6 (4.3 to 5.x) you can download the former version 3.1.4 (npm i angular-oauth2-oidc@^3 --save).
-->

# Examples

## Sample-Auth-Server

- Pending Review

## Installing

```
npm i @arroyo/ngx-oauth-oidc --save
```

## Importing the NgModule

```TypeScript
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule } from '@arroyo/ngx-oauth-oidc';
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

<!--
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

If you don't want to display a login form that tells the user that they are redirected to the identity server, you can use the convenience function ``this.oauthService.loadDiscoveryDocumentAndLogin();`` instead of ``this.oauthService.loadDiscoveryDocumentAndTryLogin();`` when setting up the library. 

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

Since 3.1 you can also automate this task by switching ``sendAccessToken`` on and by setting ``allowedUrls`` to an array with prefixes for the respective URLs. Use lower case for the prefixes.

```TypeScript
OAuthModule.forRoot({
    resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true
    }
})
```

## Routing

If you use the ``PathLocationStrategy`` (which is on by default) and have a general catch-all-route (``path: '**'``) you should be fine. Otherwise look up the section ``Routing with the HashStrategy`` in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/).

## More Documentation

See the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/) for more information about this library.

## Tutorials

* [Tutorial with Demo Servers available online](https://www.softwarearchitekt.at/post/2016/07/03/authentication-in-angular-2-with-oauth2-oidc-and-guards-for-the-newest-new-router-english-version.aspx)
* [Angular Authentication with OpenID Connect and Okta in 20 Minutes](https://developer.okta.com/blog/2017/04/17/angular-authentication-with-oidc)
* [Add Authentication to Your Angular PWA](https://developer.okta.com/blog/2017/06/13/add-authentication-angular-pwa)
* [Build an Ionic App with User Authentication](https://developer.okta.com/blog/2017/08/22/build-an-ionic-app-with-user-authentication)
* [On-Site Workshops](https://www.softwarearchitekt.at)



-->


# More Information

## TODOs for Version 1.0.0 Series

1. Remove `jsrasign` and use browser native APIs.

## Release Cycle

- TBD

The release cycle will produce new major versions whenever support for a new Angular version requires a breaking change.

## Contributions

We are still establishing our Open Source guidelines for Arroyo Networks. Please feel free to submit any contribution via Pull Request.

