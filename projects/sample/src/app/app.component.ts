import { noDiscoveryAuthConfig } from './auth-no-discovery.config';
import { googleAuthConfig } from './auth.google.config';
import { authConfig } from './auth.config';
import { FlightHistoryComponent } from './flight-history/flight-history.component';
import { Component } from '@angular/core';
import { OAuthService, AuthConfig, NullValidationHandler, JwksValidationHandler } from 'angular-oauth2-oidc';
// import { JwksValidationHandler } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { filter, delay } from 'rxjs/operators';
import { of, race } from 'rxjs';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'flight-app',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private router: Router, private oauthService: OAuthService) {
    // this.configureWithoutDiscovery();
    this.configureWithNewConfigApi();
    // this.configureAuth();
    // this.configurePasswordFlow();
  }

  private configureWithoutDiscovery() {
    this.oauthService.configure(noDiscoveryAuthConfig);
    this.oauthService.tokenValidationHandler = new NullValidationHandler();
    this.oauthService.tryLogin();
  }

  // This api will come in the next version
  private configureWithNewConfigApi() {
    this.oauthService.configure(authConfig);
    this.oauthService.setStorage(localStorage);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    this.oauthService.loadDiscoveryDocumentAndTryLogin();


    // Optional
    this.oauthService.setupAutomaticSilentRefresh();

    this.oauthService.events.subscribe(e => {
      // tslint:disable-next-line:no-console
      console.debug('oauth/oidc event', e);
    });

    this.oauthService.events
      .pipe(filter(e => e.type === 'session_terminated'))
      .subscribe(e => {
        // tslint:disable-next-line:no-console
        console.debug('Your session has been terminated!');
      });

    this.oauthService.events
      .pipe(filter(e => e.type === 'token_received'))
      .subscribe(e => {
        // this.oauthService.loadUserProfile();
      });
  }

  private configureAuth() {
    //
    // This method demonstrated the old API; see configureWithNewConfigApi for new one
    //

    // URL of the SPA to redirect the user to after login
    this.oauthService.redirectUri = window.location.origin + '/index.html';

    // URL of the SPA to redirect the user after silent refresh
    this.oauthService.silentRefreshRedirectUri =
      window.location.origin + '/silent-refresh.html';

    // The SPA's id. The SPA is registerd with this id at the auth-server
    this.oauthService.clientId = 'spa-demo';

    // set the scope for the permissions the client should request
    // The first three are defined by OIDC. The 4th is a usecase-specific one
    this.oauthService.scope = 'openid profile email voucher';

    // Url of the Identity Provider
    this.oauthService.issuer =
      'https://steyer-identity-server.azurewebsites.net/identity';

    this.oauthService.tokenValidationHandler = new NullValidationHandler();

    this.oauthService.events.subscribe(e => {
      // tslint:disable-next-line:no-console
      console.debug('oauth/oidc event', e);
    });

    // Load Discovery Document and then try to login the user
    this.oauthService.loadDiscoveryDocument().then(doc => {
      this.oauthService.tryLogin();
    });

    this.oauthService.events
      .pipe(filter(e => e.type === 'token_expires'))
      .subscribe(e => {
        // tslint:disable-next-line:no-console
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
    this.oauthService.dummyClientSecret = 'geheim';
  }
}
