import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable()
export class AuthGuard {
  constructor(private router: Router, private oauthService: OAuthService) {}

  canActivate() {
    if (
      this.oauthService.hasValidAccessToken() &&
      this.oauthService.hasValidIdToken()
    ) {
      return true;
    } else {
      this.router.navigate(['/home', { login: true }]);
      return false;
    }
  }
}
