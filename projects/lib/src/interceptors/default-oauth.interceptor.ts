import { Injectable, Optional } from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, of, merge } from 'rxjs';
import {
  catchError,
  filter,
  map,
  take,
  mergeMap,
  timeout,
} from 'rxjs/operators';
import { OAuthResourceServerErrorHandler } from './resource-server-error-handler';
import { OAuthModuleConfig } from '../oauth-module.config';
import { OAuthService } from '../oauth-service';

@Injectable()
export class DefaultOAuthInterceptor implements HttpInterceptor {
  constructor(
    private oAuthService: OAuthService,
    private errorHandler: OAuthResourceServerErrorHandler,
    @Optional() private moduleConfig: OAuthModuleConfig,
  ) {}

  private checkUrl(url: string): boolean {
    if (this.moduleConfig.resourceServer.customUrlValidation) {
      return this.moduleConfig.resourceServer.customUrlValidation(url);
    }

    if (this.moduleConfig.resourceServer.allowedUrls) {
      return !!this.moduleConfig.resourceServer.allowedUrls.find((u) =>
        url.toLowerCase().startsWith(u.toLowerCase()),
      );
    }

    return true;
  }

  public intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const url = req.url.toLowerCase();

    if (
      !this.moduleConfig ||
      !this.moduleConfig.resourceServer ||
      !this.checkUrl(url)
    ) {
      return next.handle(req);
    }

    const sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;

    if (!sendAccessToken) {
      return next
        .handle(req)
        .pipe(catchError((err) => this.errorHandler.handleError(err)));
    }

    return merge(
      of(this.oAuthService.getAccessToken()).pipe(filter((token) => !!token)),
      this.oAuthService.events.pipe(
        filter((e) => e.type === 'token_received'),
        timeout(this.oAuthService.waitForTokenInMsec || 0),
        catchError(() => of(null)), // timeout is not an error
        map(() => this.oAuthService.getAccessToken()),
      ),
    ).pipe(
      take(1),
      mergeMap((token) => {
        if (token) {
          const header = 'Bearer ' + token;
          const headers = req.headers.set('Authorization', header);
          req = req.clone({ headers });
        }

        return next
          .handle(req)
          .pipe(catchError((err) => this.errorHandler.handleError(err)));
      }),
    );
  }
}
