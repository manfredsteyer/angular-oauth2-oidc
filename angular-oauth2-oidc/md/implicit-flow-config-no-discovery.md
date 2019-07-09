# Configure Library for Implicit Flow (without discovery document)

When you don't have a discovery document, you have to configure more properties manually:

Please note that the following sample uses the original config API. For information about the new config API have a look to the project's README above.

```TypeScript
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
        // It doesn't send the user the the login page
        this.oauthService.tryLogin();


  }

}
```
