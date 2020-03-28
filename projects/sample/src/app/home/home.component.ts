import { authConfig } from '../auth.config';
import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from '../auth-code-flow.config';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  loginFailed: boolean = false;
  userProfile: object;
  usePopup: boolean;
  login: false;

  constructor(
    private route: ActivatedRoute,
    private oauthService: OAuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.login = p['login'];
    });

    // This would directly (w/o user interaction) redirect the user to the
    // login page if they are not already logged in.
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

    this.oauthService.initLoginFlow('/some-state;p1=1;p2=2?p3=3&p4=4');
    // the parameter here is optional. It's passed around and can be used after logging in
  }

  async loginImplicitInPopup() {
    // Tweak config for implicit flow
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocument();
    sessionStorage.setItem('flow', 'implicit');

    this.oauthService.initLoginFlowInPopup().then(() => {
      this.loadUserProfile();
    });
    // the parameter here is optional. It's passed around and can be used after logging in
  }

  async loginCode() {
    // Tweak config for code flow
    this.oauthService.configure(authCodeFlowConfig);
    await this.oauthService.loadDiscoveryDocument();
    sessionStorage.setItem('flow', 'code');

    this.oauthService.initLoginFlow('/some-state;p1=1;p2=2?p3=3&p4=4');
    // the parameter here is optional. It's passed around and can be used after logging in
  }

  async loginCodeInPopup() {
    // Tweak config for code flow
    this.oauthService.configure(authCodeFlowConfig);
    await this.oauthService.loadDiscoveryDocument();
    sessionStorage.setItem('flow', 'code');

    this.oauthService.initLoginFlowInPopup().then(() => {
      this.loadUserProfile();
    });
  }

  logout() {
    // this.oauthService.logOut();
    this.oauthService.revokeTokenAndLogout();
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

    if (
      !this.oauthService.useSilentRefresh &&
      this.oauthService.responseType === 'code'
    ) {
      this.oauthService
        .refreshToken()
        .then(info => console.debug('refresh ok', info))
        .catch(err => console.error('refresh error', err));
    } else {
      this.oauthService
        .silentRefresh()
        .then(info => console.debug('silent refresh ok', info))
        .catch(err => console.error('silent refresh error', err));
    }
  }

  set requestAccessToken(value: boolean) {
    this.oauthService.requestAccessToken = value;
    localStorage.setItem('requestAccessToken', '' + value);
  }

  get requestAccessToken() {
    return this.oauthService.requestAccessToken;
  }

  set useHashLocationStrategy(value: boolean) {
    const oldValue = localStorage.getItem('useHashLocationStrategy') === 'true';
    if (value !== oldValue) {
      localStorage.setItem('useHashLocationStrategy', value ? 'true' : 'false');
      window.location.reload();
    }
  }

  get useHashLocationStrategy() {
    return localStorage.getItem('useHashLocationStrategy') === 'true';
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
