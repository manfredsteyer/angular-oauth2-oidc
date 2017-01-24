# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular.

## Credits

- generator-angular2-library: https://github.com/jvandemo/generator-angular2-library

## Tested Environment

Successfully tested with the Angular 2.x and it's Router, PathLocationStrategy and CommonJS-Bundling via webpack.

## Features

- Logging in via OAuth2 and OpenId Connect (OIDC) Implicit Flow (where user is redirected to Identity Provider)
- "Logging in" via Password Flow (where user enters his/her password into the client)
- Using OIDC is optional
- Token Refresh for Password Flow (Implicit Flow doesn't allow for refresh tokens by design)
- Querying Userinfo Endpoint
- Querying Discovery Document to ease configuration
- Validating claims of the id_token regarding the specs (aud, iss, nbf, exp, at_hash)
- Hook for validating the signature of the received id_token
- Single-Sign-Out by redirecting to the auth-server's logout-endpoint

## Sample-Auth-Server

You can use the OIDC-Sample-Server mentioned in the samples for Testing. It assumes, that your Web-App runns on http://localhost:8080.

Username/Password: max/geheim

## Resources

- Sources of this lib: https://github.com/manfredsteyer/angular-oauth2-oidc
- Sample Project: https://github.com/manfredsteyer/angular2-oauth-oidc-demo

## Setup Provider for OAuthService

```
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

## Using Implicit Flow

This section shows how to use the implicit flow, which is redirecting the user to the auth-server for the login.

### Configure Library for Implicit Flow (using discovery document)

To configure the library you just have to set some properties on startup. For this, the following sample uses the constructor of the AppComponent which is called before routing kicks in.

```
@Component({ ... })
export class AppComponent {

  constructor(private oauthService: OAuthService) {
        
        // URL of the SPA to redirect the user to after login
        this.oauthService.redirectUri = window.location.origin + "/index.html";

        // The SPA's id. The SPA is registerd with this id at the auth-server
        this.oauthService.clientId = "spa-demo";

        // set the scope for the permissions the client should request
        // The first three are defined by OIDC. The 4th is a usecase-specific one
        this.oauthService.scope = "openid profile email voucher";

        // set to true, to receive also an id_token via OpenId Connect (OIDC) in addition to the
        // OAuth2-based access_token
        this.oauthService.oidc = true;

        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        this.oauthService.setStorage(sessionStorage);

        // The name of the auth-server that has to be mentioned within the token
        this.oauthService.issuer = "https://steyer-identity-server.azurewebsites.net/identity";
        
        // Load Discovery Document and then try to login the user
        this.oauthService.loadDiscoveryDocument().then(() => {

            // This method just tries to parse the token(s) within the url when
            // the auth-server redirects the user back to the web-app
            // It dosn't send the user the the login page
            this.oauthService.tryLogin({});      

        });

  }

}
```

### Configure Library for Implicit Flow (without discovery document)

When you don't have a discovery document, you have to configure more properties manually:

```
@Component({ ... })
export class AppComponent {

  constructor(private oauthService: OAuthService) {
        
        // Login-Url
        this.oauthService.loginUrl = "https://steyer-identity-server.azurewebsites.net/identity/connect/authorize"; //Id-Provider?

        // URL of the SPA to redirect the user to after login
        this.oauthService.redirectUri = window.location.origin + "/index.html";

        // The SPA's id. Register SPA with this id at the auth-server
        this.oauthService.clientId = "spa-demo";

        // set the scope for the permissions the client should request
        this.oauthService.scope = "openid profile email voucher";

        // set to true, to receive also an id_token via OpenId Connect (OIDC) in addition to the
        // OAuth2-based access_token
        this.oauthService.oidc = true;

        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        this.oauthService.setStorage(sessionStorage);

        // To also enable single-sign-out set the url for your auth-server's logout-endpoint here
        this.oauthService.logoutUrl = "https://steyer-identity-server.azurewebsites.net/identity/connect/endsession?id_token={{id_token}}";

        // This method just tries to parse the token(s) within the url when
        // the auth-server redirects the user back to the web-app
        // It dosn't send the user the the login page
        this.oauthService.tryLogin({});      


  }

}
```

### Home-Component (for login)

```
import { Component } from '@angular/core';
import { OAuthService } from 'angular2-oauth2/oauth-service';

@Component({
    templateUrl: "app/home.html" 
})
export class HomeComponent {
    
    constructor(private oAuthService: OAuthService) {
    }
    
    public login() {
        this.oAuthService.initImplicitFlow();
    }
    
    public logoff() {
        this.oAuthService.logOut();
    }
    
    public get name() {
        let claims = this.oAuthService.getIdentityClaims();
        if (!claims) return null;
        return claims.given_name; 
    }
    
}
```

```
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

### Validate id_token

In cases where security relies on the id_token (e. g. in hybrid apps that use it to provide access to local resources)
you could use the callback ``validationHandler`` to define the logic to validate the token's signature. 
The following sample uses the validation-endpoint of [IdentityServer3](https://github.com/IdentityServer/IdentityServer3) for this:

```
this.oauthService.tryLogin({
    validationHandler: context => {
        var search = new URLSearchParams();
        search.set('token', context.idToken); 
        search.set('client_id', oauthService.clientId);
        return http.get(validationUrl, { search }).toPromise();
    }
});
```

### Calling a Web API with OAuth-Token

Pass this Header to the used method of the ``Http``-Service within an Instance of the class ``Headers``:

```
var headers = new Headers({
    "Authorization": "Bearer " + this.oauthService.getAccessToken()
});
```


### Callback after successful login

There is a callback ``onTokenReceived``, that is called after a successful login. In this case, the lib received the access_token as
well as the id_token, if it was requested. If there is an id_token, the lib validated it in view of it's claims 
(aud, iss, nbf, exp, at_hash) and - if a ``validationHandler`` has been set up - with this ``validationHandler``, e. g. to validate
the signature of the id_token.

```
this.oauthService.tryLogin({
    onTokenReceived: context => {
        //
        // Output just for purpose of demonstration
        // Don't try this at home ... ;-)
        // 
        console.debug("logged in");
        console.debug(context);
    },
    validationHandler: context => {
        var search = new URLSearchParams();
        search.set('token', context.idToken); 
        search.set('client_id', oauthService.clientId);
        return http.get(validationUrl, { search}).toPromise();
    }
});
```

## Using Password-Flow

This section shows how to use the password flow, which demands the user to directly enter his or her password into the client.

### Configure Library for Password Flow (using discovery document)

To configure the library you just have to set some properties on startup. For this, the following sample uses the constructor of the AppComponent which is called before routing kicks in.

Please not, that this configuation is quite similar to the one for the implcit flow.

```
@Component({ ... })
export class AppComponent {

  constructor(private oauthService: OAuthService) {
      
        // The SPA's id. Register SPA with this id at the auth-server
        this.oauthService.clientId = "demo-resource-owner";

        // set the scope for the permissions the client should request
        // The auth-server used here only returns a refresh token (see below), when the scope offline_access is requested
        this.oauthService.scope = "openid profile email voucher offline_access";

        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        this.oauthService.setStorage(sessionStorage);

        // Set a dummy secret
        // Please note that the auth-server used here demand the client to transmit a client secret, although
        // the standard explicitly cites that the password flow can also be used without it. Using a client secret
        // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
        // Using such a dummy secreat is as safe as using no secret.
        this.oauthService.dummyClientSecret = "geheim";

        // Load Discovery Document and then try to login the user
        let url = 'https://steyer-identity-server.azurewebsites.net/identity/.well-known/openid-configuration';
        this.oauthService.loadDiscoveryDocument(url).then(() => {
            // Do what ever you want here
        });

  }

}
```

### Configure Library for Password Flow (without discovery document)

In cases where you don't have an OIDC based discovery document you have to configure some more properties manually:

```
@Component({ ... })
export class AppComponent {

  constructor(private oauthService: OAuthService) {
      
        // Login-Url
        //this.oauthService.loginUrl = "https://steyer-identity-server.azurewebsites.net/identity/connect/authorize"; //Id-Provider?

        // Url with user info endpoint
        // This endpont is described by OIDC and provides data about the loggin user
        // This sample uses it, because we don't get an id_token when we use the password flow
        // If you don't want this lib to fetch data about the user (e. g. id, name, email) you can skip this line
        this.oauthService.userinfoEndpoint = "https://steyer-identity-server.azurewebsites.net/identity/connect/userinfo";

        // The SPA's id. Register SPA with this id at the auth-server
        this.oauthService.clientId = "demo-resource-owner";

        // set the scope for the permissions the client should request
        // The auth-server used here only returns a refresh token (see below), when the scope offline_access is requested
        this.oauthService.scope = "openid profile email voucher offline_access";

        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        this.oauthService.setStorage(sessionStorage);

        // Set a dummy secret
        // Please note that the auth-server used here demand the client to transmit a client secret, although
        // the standard explicitly cites that the password flow can also be used without it. Using a client secret
        // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
        // Using such a dummy secreat is as safe as using no secret.
        this.oauthService.dummyClientSecret = "geheim";

        // Load Discovery Document and then try to login the user
        let url = 'https://steyer-identity-server.azurewebsites.net/identity/.well-known/openid-configuration';
        this.oauthService.loadDiscoveryDocument(url).then(() => {
            // Do what ever you want here
        });

  }

}
```

## Fetching an Access Token by providing the current user's credentials

```
this.oauthService.fetchTokenUsingPasswordFlow('max', 'geheim').then((resp) => {
          
      // Loading data about the user
      return this.oauthService.loadUserProfile();

}).then(() => {

      // Using the loaded user data
      let claims = this.oAuthService.getIdentityClaims();
      if (claims) console.debug('given_name', claims.given_name); 
  
})
```

There is also a short form for fetching the token and loading the user profile:

```
this.oauthService.fetchTokenUsingPasswordFlowAndLoadUserProfile('max', 'geheim').then(() => {
      let claims = this.oAuthService.getIdentityClaims();
      if (claims) console.debug('given_name', claims.given_name); 
});      
```

## Refreshing the current Access Token

Using the password flow you MIGHT get a refresh token (which isn't the case with the implicit flow by design!). You can use this token later to get a new access token, e. g. after it expired.

```
this.oauthService.refreshToken().then(() => {
          console.debug('ok');
})
```