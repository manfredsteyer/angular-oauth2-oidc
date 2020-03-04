# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular. 

![OIDC Certified Logo](https://raw.githubusercontent.com/manfredsteyer/angular-oauth2-oidc/master/oidc.png)

## Credits

- [jsrasign](https://kjur.github.io/jsrsasign/) for validating token signature and for hashing
- [Identity Server](https://github.com/identityserver) for testing with an .NET/.NET Core Backend
- [Keycloak (Redhat)](http://www.keycloak.org/) for testing with Java

## Resources

- Sources and Sample: [https://github.com/manfredsteyer/angular-oauth2-oidc](https://github.com/manfredsteyer/angular-oauth2-oidc)
- Source Code Documentation: [https://manfredsteyer.github.io/angular-oauth2-oidc/docs](https://manfredsteyer.github.io/angular-oauth2-oidc/docs)
- Community-provided sample implementation: [https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/](https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/)

## Breaking Change in Version 9

With regards to tree shaking, beginning with version 9, the ``JwksValidationHandler`` has been moved to a library of its own. If you need it for implementing **implicit flow**, please install it using npm:

```
npm i angular-oauth2-oidc-jwks --save
```

After that, you can import it into your application by using this:

```typescript
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
```

instead of that:

```typescript
import { JwksValidationHandler } from 'angular-oauth2-oidc';
```

Please note, that this dependency is not needed for the **code flow**, which is nowadays the **recommended** flow for single page applications. This also results in smaller bundle sizes.


## Tested Environment

Successfully tested with **Angular 9** and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. At server side we've used IdentityServer (.NET / .NET Core) and Redhat's Keycloak (Java).

**Angular 9**: Use 9.x versions of this library.

**Angular 8**: Use 8.x versions of this library.

**Angular 7**: Use 7.x versions of this library.

**Angular 6**: Use Version 4.x of this library. Version 4.x was tested with Angular 6. You can also try the newer version 5.x of this library which has a much smaller bundle size.

**Angular 5.x or 4.3**: If you need support for Angular < 6 (4.3 to 5.x) you can download the former version 3.1.4 (npm i angular-oauth2-oidc@^3 --save).

## Release Cycle

- We plan one major release for each Angular version
  - Will contain new features
  - Will contain bug fixes and PRs
- Critical bugfixes on demand

## Contributions

- Feel free to file pull requests
- The issues contain some ideas for PRs and enhancements (see labels)
- If you want to contribute to the docs, you can do so in the `docs-src` folder. Make sure you update `summary.json` as well. Then generate the docs with the following commands:

  ``` sh
  npm install -g @compodoc/compodoc
  npm run docs
  ```

## Features

- Logging in via Code Flow + PKCE 
  - Hence, you are safe for the upcoming OAuth 2.1
- Logging in via Implicit Flow (where a user is redirected to Identity Provider)
- "Logging in" via Password Flow (where a user enters their password into the client)
- Token Refresh for all supported flows
- Automatically refreshing a token when/some time before it expires
- Querying Userinfo Endpoint
- Querying Discovery Document to ease configuration
- Validating claims of the id_token regarding the specs
- Hook for further custom validations
- Single-Sign-Out by redirecting to the auth-server's logout-endpoint

## Sample-Auth-Server

You can use the OIDC-Sample-Server used in our examples. It assumes, that your Web-App runs on http://localhost:4200

Username/Password: 
  - max/geheim
  - bob/bob
  - alice/alice

*clientIds:*

- spa (Code Flow + PKCE)
- implicit (implicit flow)

*redirectUris:*

- localhost:[4200-4202]
- localhost:[4200-4202]/index.html
- localhost:[4200-4202]/silent-refresh.html

## Installing

```sh
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

# Logging in 

Since Version 8, this library supports code flow and [PKCE](https://tools.ietf.org/html/rfc7636) to align with the current draft of the [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13) document. This is also the foundation of the upcoming OAuth 2.1.


To configure your solution for code flow + PKCE you have to set the `responseType` to `code`:

  ```TypeScript
    import { AuthConfig } from 'angular-oauth2-oidc';

    export const authCodeFlowConfig: AuthConfig = {
      // Url of the Identity Provider
      issuer: 'https://demo.identityserver.io',

      // URL of the SPA to redirect the user to after login
      redirectUri: window.location.origin + '/index.html',

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
      scope: 'openid profile email offline_access api',

      showDebugInformation: true,

      // Not recommented:
      // disablePKCI: true,
    };
  ```

After this, you can initialize the code flow using:

  ```TypeScript
  this.oauthService.initCodeFlow();
  ```

There is also a convenience method `initLoginFlow` which initializes either the code flow or the implicit flow depending on your configuration. 

  ```TypeScript
  this.oauthService.initLoginFlow();
  ```

Also -- as shown in the readme -- you have to execute the following code when bootstrapping to make the library to fetch the token:

```TypeScript
this.oauthService.configure(authCodeFlowConfig);
this.oauthService.loadDiscoveryDocumentAndTryLogin();
```


### Skipping the Login Form

If you don't want to display a login form that tells the user that they are redirected to the identity server, you can use the convenience function ``this.oauthService.loadDiscoveryDocumentAndLogin();`` instead of ``this.oauthService.loadDiscoveryDocumentAndTryLogin();`` when setting up the library.

This directly redirects the user to the identity server if there are no valid tokens. Ensure you have your `issuer` set to your discovery document endpoint!


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

## Token Refresh

See docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/refreshing-a-token.html

## Routing

If you use the ``PathLocationStrategy`` (which is on by default) and have a general catch-all-route (``path: '**'``) you should be fine. Otherwise look up the section ``Routing with the HashStrategy`` in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/).

## Implicit Flow

Nowadays, using code flow + PKCE -- as shown above -- is the recommended OAuth 2/OIDC flow for SPAs. To use the older implicit flow, lookup this docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/implicit-flow.html

## More Documentation (!)

See the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/) for more information about this library.

## Tutorials

- [Tutorial with Demo Servers available online](https://www.softwarearchitekt.at/post/2016/07/03/authentication-in-angular-2-with-oauth2-oidc-and-guards-for-the-newest-new-router-english-version.aspx)
- [Angular Authentication with OpenID Connect and Okta in 20 Minutes](https://developer.okta.com/blog/2017/04/17/angular-authentication-with-oidc)
- [Add Authentication to Your Angular PWA](https://developer.okta.com/blog/2017/06/13/add-authentication-angular-pwa)
- [Build an Ionic App with User Authentication](https://developer.okta.com/blog/2017/08/22/build-an-ionic-app-with-user-authentication)
- [On-Site Workshops](https://www.softwarearchitekt.at)
- [Angular 6 with Auth0 using this library](https://github.com/jeroenheijmans/sample-auth0-angular-oauth2-oidc)
