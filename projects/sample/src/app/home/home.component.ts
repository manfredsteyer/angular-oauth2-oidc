import { authConfig } from '../auth.config';
import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from '../auth-code-flow.config';

@Component({
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  loginFailed: boolean = false;
  userProfile: object;

  constructor(private oauthService: OAuthService) {
  }

  ngOnInit() {
    /*
        this.oauthService.loadDiscoveryDocumentAndTryLogin().then(_ => {
            if (!this.oauthService.hasValidIdToken() || !this.oauthService.hasValidAccessToken()) {
              this.oauthService.initImplicitFlow('some-state');
            }
        });
    */
  }

  async loginImplicit() {

    // Tweak config for implicit flow
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocument();
    sessionStorage.setItem('flow', 'implicit');

    this.oauthService.initLoginFlow('/some-state;p1=1;p2=2');
      // the parameter here is optional. It's passed around and can be used after logging in
  }

  async loginCode() {
      // Tweak config for code flow
      this.oauthService.configure(authCodeFlowConfig);
      await this.oauthService.loadDiscoveryDocument();
      sessionStorage.setItem('flow', 'code');
  
      this.oauthService.initLoginFlow('/some-state;p1=1;p2=2');
       // the parameter here is optional. It's passed around and can be used after logging in
  }

  logout() {
    this.oauthService.logOut();
  }

  loadUserProfile(): void {
    this.oauthService.loadUserProfile().then(up => (this.userProfile = up));
  }

  get givenName() {
    var claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims['given_name'];
  }

  get familyName() {
    var claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims['family_name'];
  }

  refresh() {

    this.oauthService.oidc = true;

    if (this.oauthService.responseType === 'code') {
      this.oauthService
        .refreshToken()
        .then(info => console.debug('refresh ok', info))
        .catch(err => console.error('refresh error', err));
    } else {
      this.oauthService
        .silentRefresh()
        .then(info => console.debug('refresh ok', info))
        .catch(err => console.error('refresh error', err));
    }
  }

  set requestAccessToken(value: boolean) {
    this.oauthService.requestAccessToken = value;
    localStorage.setItem('requestAccessToken', '' + value);
  }

  get requestAccessToken() {
    return this.oauthService.requestAccessToken;
  }

  get id_token() {
    return this.oauthService.getIdToken();
  }

  get access_token() {
    return this.oauthService.getAccessToken();
  }

  get id_token_expiration() {
    return this.oauthService.getIdTokenExpiration();
  }

  get access_token_expiration() {
    return this.oauthService.getAccessTokenExpiration();
  }
}
