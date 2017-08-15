import { FlightHistoryComponent } from './flight-history/flight-history.component';
import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc';
import { Router } from "@angular/router";

@Component({
    selector: 'flight-app',
    templateUrl: './app.component.html'
})
export class AppComponent {
    public info: string = "Welt";

    constructor(
        private router: Router,
        private oauthService: OAuthService) {

        // URL of the SPA to redirect the user to after login
        this.oauthService.redirectUri = window.location.origin + "/index.html";

        // URL of the SPA to redirect the user after silent refresh
        this.oauthService.silentRefreshRedirectUri = window.location.origin + "/silent-refresh.html";
 
        // The SPA's id. The SPA is registerd with this id at the auth-server
        this.oauthService.clientId = "spa-demo";
 
        // set the scope for the permissions the client should request
        // The first three are defined by OIDC. The 4th is a usecase-specific one
        this.oauthService.scope = "openid profile email voucher";
 
        let requestAccessTokenAsString = localStorage.getItem('requestAccessToken');
        if (requestAccessTokenAsString) {
            
            let requestAccessToken = requestAccessTokenAsString == 'true';
            this.oauthService.requestAccessToken = requestAccessToken;
        }
        // set to true, to receive also an id_token via OpenId Connect (OIDC) in addition to the
        // OAuth2-based access_token
        // this.oauthService.oidc = true;
 
        // Use setStorage to use sessionStorage or another implementation of the TS-type Storage
        // instead of localStorage
        // this.oauthService.setStorage(sessionStorage);

        this.oauthService.issuer = 'https://steyer-identity-server.azurewebsites.net/identity';

            this.oauthService.customQueryParams = {
                'tenant': '4711',
                'otherParam': 'someValue'
            };

        // Set a dummy secret
        // Please note that the auth-server used here demand the client to transmit a client secret, although
        // the standard explicitly cites that the password flow can also be used without it. Using a client secret
        // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
        // Using such a dummy secreat is as safe as using no secret.
        this.oauthService.dummyClientSecret = "geheim";

        this.oauthService.tokenValidationHandler = new JwksValidationHandler();

        // Load Discovery Document and then try to login the user
        this.oauthService.loadDiscoveryDocument().then((doc) => {
 
            console.debug('discovery document', doc);
            console.debug('jwks document', this.oauthService.jwks);
            // This method just tries to parse the token(s) within the url when
            // the auth-server redirects the user back to the web-app
            // It dosn't send the user the the login page

            console.debug(this.oauthService.tokenEndpoint);

            this.oauthService.events.subscribe(e => {
                console.debug('oauth/oidc event', e);
            })

            let initialNavigation = true;

            this.oauthService.tryLogin({
                onTokenReceived: (info) => {
                    console.debug('state', info.state);
                }
            })
            /*
            .then(_ => {
                if (initialNavigation) {
                    this.router.navigate(['/']);
                    initialNavigation = false;
                }
            });
            */
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

}



