import { Component, OnInit } from '@angular/core';
import { OAuthService, JwksValidationHandler, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { AuthConfigFactory } from './oidc/auth.config';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'sample2';

  /**
   *
   */
  constructor(private oauthService: OAuthService) {

  }
  ngOnInit() {
    this.configureOAuth();
    this.runTryLogin();
  }

  private configureOAuth() {
    this.oauthService.configure(AuthConfigFactory('https://nmsidp.com:44301', 'rahavard_angular'));
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    this.oauthService.events.pipe(filter((x: any) => x.type === 'token_refresh_error'))
      .subscribe((x: OAuthErrorEvent) => {
        this.oauthService.initCodeFlow();
      })
  }

  private runTryLogin() {
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(data => {
      if (this.oauthService.getRefreshToken()) {
        this.oauthService.setupAutomaticSilentRefresh();
      }
    }).then(data => {
      if (!this.oauthService.getRefreshToken()) {
        this.oauthService.initCodeFlow();
      } else if (!this.oauthService.hasValidAccessToken() || !this.oauthService.hasValidIdToken()) {
        this.oauthService.refreshToken();
      }
    });
  }
}
