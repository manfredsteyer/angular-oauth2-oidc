import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Injectable } from '@angular/core';

@Injectable()
export class RouteGuard implements CanActivate {

  constructor(
    private oauthService: OAuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.oauthService.getRefreshToken()) {
      if (this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()) {
        return true;
      } else {
        this.oauthService.refreshToken();
        return false;
      }
    } else {
      this.oauthService.initCodeFlow();
      return false;
    }
  }

}
