# Original Config API

To configure the library you just have to set some properties on startup. For this, the following sample uses the constructor of the AppComponent which is called before routing kicks in.

Please note that the following sample uses the original config API. For information about the new config API have a look to the project's README above.

```TypeScript
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
