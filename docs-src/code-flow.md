# Code Flow

Since Version 8, this library also supports code flow and [PKCE](https://tools.ietf.org/html/rfc7636) to align with the current draft of the [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13) document. 


To configure your solution for code flow + PKCE you have to set the `responseType` to `code`:

  ```TypeScript
    import { AuthConfig } from 'angular-oauth2-oidc';

    export const authCodeFlowConfig: AuthConfig = {
      // Url of the Identity Provider
      issuer: 'https://demo.identityserver.io',

      // URL of the SPA to redirect the user to after login
      redirectUri: window.location.origin + '/index.html',

      // The SPA's id. The SPA is registered with this id at the auth-server
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

      // Not recommended:
      // disablePKCE: true,
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



