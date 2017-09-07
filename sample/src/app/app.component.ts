import { FlightHistoryComponent } from './flight-history/flight-history.component';
import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc';
import { Router } from "@angular/router";
// import { authConfig } from './auth.config';

@Component({
    selector: 'flight-app',
    templateUrl: './app.component.html'
})
export class AppComponent {

    constructor(
        private router: Router,
        private oauthService: OAuthService) {

      // this.configureWithNewConfigApi();
      this.configureAuth();
      // this.configurePasswordFlow();
      
    }


    // This api will come in the next version
    /*
    private configureWithNewConfigApi() {

      this.oauthService.configure(authConfig);
      this.oauthService.tokenValidationHandler = new JwksValidationHandler();
      this.oauthService.loadDiscoveryDocumentAndTryLogin();

      // Optional
      this.oauthService.setupAutomaticSilentRefresh();
      this.oauthService.events.subscribe(e => {
        console.debug('oauth/oidc event', e);
      });
    }
    */

  private configureAuth() {
    // URL of the SPA to redirect the user to after login
    this.oauthService.redirectUri = window.location.origin + "/index.html";

    // URL of the SPA to redirect the user after silent refresh
    this.oauthService.silentRefreshRedirectUri = window.location.origin + "/silent-refresh.html";

    // The SPA's id. The SPA is registerd with this id at the auth-server
    this.oauthService.clientId = "spa-demo";

    // set the scope for the permissions the client should request
    // The first three are defined by OIDC. The 4th is a usecase-specific one
    this.oauthService.scope = "openid profile email voucher";

    // Url of the Identity Provider
    this.oauthService.issuer = 'https://steyer-identity-server.azurewebsites.net/identity';

    this.oauthService.tokenValidationHandler = new JwksValidationHandler();

    this.oauthService.events.subscribe(e => {
      console.debug('oauth/oidc event', e);
    });

    // Load Discovery Document and then try to login the user
    this.oauthService.loadDiscoveryDocument().then((doc) => {
      this.oauthService.tryLogin();
    });

    this
      .oauthService
      .events
      .filter(e => e.type == 'token_expires')
      .subscribe(e => {
        console.debug('received token_expires event', e);
        this.oauthService.silentRefresh();
      });
  }

  private configurePasswordFlow() {

      // Set a dummy secret
      // Please note that the auth-server used here demand the client to transmit a client secret, although
      // the standard explicitly cites that the password flow can also be used without it. Using a client secret
      // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
      // Using such a dummy secreat is as safe as using no secret.
      this.oauthService.dummyClientSecret = "geheim";

  }

}



