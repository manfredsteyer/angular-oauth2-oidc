# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular.

## Credits

- generator-angular2-library: https://github.com/jvandemo/generator-angular2-library

## Tested Environment

Successfully tested with the Angular 2 and 4 and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. At server side we've used IdentityServer (.NET/ .NET Core) and Redhat's Keycloak (Java).

## New Features in Version 2
- Token Refresh for Implicit Flow by implementing "silent refresh"
- Validating the signature of the received id_token
- Providing Events via the observable ``events``.
- The event ``token_expires`` can be used togehter with a silent refresh to automatically refresh a token when/ before it expires (see also property ``timeoutFactor``).

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

        // The name of the auth-server that has to be mentioned within the token
        this.oauthService.issuer = "https://steyer-identity-server.azurewebsites.net/identity";
        
        // Load Discovery Document and then try to login the user
        this.oauthService.loadDiscoveryDocument().then(() => {

            // This method just tries to parse the token(s) within the url when
            // the auth-server redirects the user back to the web-app
            // It dosn't send the user the the login page
            this.oauthService.tryLogin();      

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

        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        this.oauthService.setStorage(sessionStorage);

        // To also enable single-sign-out set the url for your auth-server's logout-endpoint here
        this.oauthService.logoutUrl = "https://steyer-identity-server.azurewebsites.net/identity/connect/endsession";

        // This method just tries to parse the token(s) within the url when
        // the auth-server redirects the user back to the web-app
        // It dosn't send the user the the login page
        this.oauthService.tryLogin();      


  }

}
```

### Home-Component (for login)

```
import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

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

You can hook in an implementation of the interface ``TokenValidator`` to validate the signature of the received id_token and its at_hash property. This packages provides two implementations:

- JwksValidationHandler
- NullValidationHandler

The former one validates the signature against public keys received via the discovery document (property jwks) and the later one skips the validation on client side. 

```
import { JwksValidationHandler } from 'angular-oauth2-oidc';

[...]

this.oauthService.tokenValidationHandler = new JwksValidationHandler();
```

In cases where no ValidationHandler is defined, you receive a warning on the console. This means that the library wants you to explicitly decide on this. 

### Validate id_token (legacy, deprecated)

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

### Refreshing a Token when using Implicit Flow

To refresh your tokens when using implicit flow you can use a silent refresh. This is a well-known solution that compensates the fact that implicit flow does not allow for issuing a refresh token. It uses a hidden iframe to get another token from the auth-server. When the user is there still logged in (by using a cookie) it will respond without user interaction and provide new tokens.

To use this approach, setup a redirect uri for the silent refresh:

```
this.oauthService.silentRefreshRedirectUri = window.location.origin + "/silent-refresh.html";
```

Please keep in mind that this uri has to be configured at the auth-server too.

This file is loaded into the hidden iframe after getting new tokens. Its only task is to send the received tokens to the main application:

```
<html>
<body>
    <script>
    parent.postMessage(location.hash, location.origin);
    </script>
</body>
</html>
```

Please make sure that this file is copied to your output directory by your build task. When using the CLI you can define it as an asset for this. For this, you have to add the following line to the file ``.angular-cli.json``:

```
"assets": [
    [...],
    "silent-refresh.html"
],
```

To perform a silent refresh, just call the following method:

```
this
    .oauthService
    .silentRefresh()
    .then(info => console.debug('refresh ok', info))
    .catch(err => console.error('refresh error', err));
```

When there is an error in the iframe that prevents the communication with the main application, silentRefresh will give you a timeout. To configure the timespan for this, you can set the property ``siletRefreshTimeout`` (msec). The default value is 20.000 (20 seconds).

### Automatically refreshing a token when/ before it expires

To automatically refresh a token when/ some time before it expires, you can make use of the event ``token_expires``:

```
this
    .oauthService
    .events
    .filter(e => e.type == 'token_expires')
    .subscribe(e => {
        this.oauthService.silentRefresh();
    });
```

By default, this event is fired after 75% of the token's life time is over. You can adjust this factor by setting the property ``timeoutFactor`` to a value between 0 and 1. For instance, 0.5 means, that the event is fired after half of the life time is over and 0.33 triggers the event after a third.

### Callback after successful login

There is a callback ``onTokenReceived``, that is called after a successful login. In this case, the lib received the access_token as
well as the id_token, if it was requested. If there is an id_token, the lib validated it.

```
this.oauthService.tryLogin({
    onTokenReceived: context => {
        //
        // Output just for purpose of demonstration
        // Don't try this at home ... ;-)
        // 
        console.debug("logged in");
        console.debug(context);
    }
});
```

## Preserving State like the requested URL

When calling ``initImplicitFlow``, you can pass an optional state which could be the requested url:

```
this.oauthService.initImplicitFlow('http://www.myurl.com/x/y/z');
```

After login succeeded, you can read this state:

```
this.oauthService.tryLogin({
    onTokenReceived: (info) => {
        console.debug('state', info.state);
    }
})
```

### Custom Query Parameter

You can set the property ``customQueryParams`` to a hash with custom parameter that are transmitted when starting implicit flow.

```
this.oauthService.customQueryParams = {
    'tenant': '4711',
    'otherParam': 'someValue'
};
```

## Routing with the HashStrategy

If you are leveraging the ``LocationStrategy`` which the Router is using by default, you can skip this section.

When using the ``HashStrategy`` for Routing, the Router will override the received hash fragment with the tokens when it performs it initial navigation. This prevents the library from reading them. To avoid this, disable initial navigation when setting up the routes for your root module:

```
export let AppRouterModule = RouterModule.forRoot(APP_ROUTES, { 
    useHash: true,
    initialNavigation: false
});
```

After tryLogin did its job, you can manually perform the initial navigation:

```
this.oauthService.tryLogin().then(_ => {
    this.router.navigate(['/']);
})     
```

Another solution is the use a redirect uri that already contains the initial route. In this case the router will not override it. An example for such a redirect uri is

```
    http://localhost:8080/#/home
```

## Events

```
this.oauthService.events.subscribe(e => {
    console.debug('oauth/oidc event', e);
})
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
        this.oauthService.tokenEndpoint = "https://steyer-identity-server.azurewebsites.net/identity/connect/token"; 

        // Url with user info endpoint
        // This endpont is described by OIDC and provides data about the loggin user
        // This sample uses it, because we don't get an id_token when we use the password flow
        // If you don't want this lib to fetch data about the user (e. g. id, name, email) you can skip this line
        this.oauthService.userinfoEndpoint = "https://steyer-identity-server.azurewebsites.net/identity/connect/userinfo";

        // The SPA's id. Register SPA with this id at the auth-server
        this.oauthService.clientId = "demo-resource-owner";

        // set the scope for the permissions the client should request
        this.oauthService.scope = "openid profile email voucher offline_access";

        // Set a dummy secret
        // Please note that the auth-server used here demand the client to transmit a client secret, although
        // the standard explicitly cites that the password flow can also be used without it. Using a client secret
        // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
        // Using such a dummy secreat is as safe as using no secret.
        this.oauthService.dummyClientSecret = "geheim";

  }

}
```

### Fetching an Access Token by providing the current user's credentials

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

### Refreshing the current Access Token

Using the password flow you MIGHT get a refresh token (which isn't the case with the implicit flow by design!). You can use this token later to get a new access token, e. g. after it expired.

```
this.oauthService.refreshToken().then(() => {
          console.debug('ok');
})
```