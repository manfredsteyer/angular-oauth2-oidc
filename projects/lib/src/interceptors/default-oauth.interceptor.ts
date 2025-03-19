import { inject, Injectable, Optional } from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  type HttpHandlerFn,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { merge, Observable, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  take,
  timeout,
} from 'rxjs/operators';
import { OAuthModuleConfig } from '../oauth-module.config';
import { OAuthService } from '../oauth-service';
import { OAuthResourceServerErrorHandler } from './resource-server-error-handler';

/**
 * @ignore
 */
function checkUrl(moduleConfig: OAuthModuleConfig, url: string): boolean {
  if (moduleConfig.resourceServer.customUrlValidation) {
    return moduleConfig.resourceServer.customUrlValidation(url);
  }

  if (moduleConfig.resourceServer.allowedUrls) {
    return !!moduleConfig.resourceServer.allowedUrls.find((u) =>
      url.toLowerCase().startsWith(u.toLowerCase())
    );
  }

  return true;
}

/**
 * @ignore
 * TODO: Remove this function when class DefaultOAuthInterceptor is removed\
 * move the core of this function inside the function defaultOAuthInterceptor
 */
function interceptFn(
  oAuthService: OAuthService,
  errorHandler: OAuthResourceServerErrorHandler,
  moduleConfig: OAuthModuleConfig,
  request: HttpRequest<any>,
  next: HttpHandlerFn | HttpHandler
) {
  const handler = typeof next === 'function' ? next : next.handle;
  const url = request.url.toLowerCase();

  if (
    !moduleConfig ||
    !moduleConfig.resourceServer ||
    !checkUrl(moduleConfig, url)
  ) {
    return handler(request);
  }

  const sendAccessToken = moduleConfig.resourceServer.sendAccessToken;

  if (!sendAccessToken) {
    return handler(request).pipe(
      catchError((err) => errorHandler.handleError(err))
    );
  }

  return merge(
    of(oAuthService.getAccessToken()).pipe(filter((token) => !!token)),
    oAuthService.events.pipe(
      filter((e) => e.type === 'token_received'),
      timeout(oAuthService.waitForTokenInMsec || 0),
      catchError(() => of(null)), // timeout is not an error
      map(() => oAuthService.getAccessToken())
    )
  ).pipe(
    take(1),
    mergeMap((token) => {
      if (token) {
        const header = 'Bearer ' + token;
        const headers = request.headers.set('Authorization', header);
        request = request.clone({ headers });
      }

      return handler(request).pipe(
        catchError((err) => errorHandler.handleError(err))
      );
    })
  );
}

export function defaultOAuthInterceptor(
  request: HttpRequest<any>,
  next: HttpHandlerFn
) {
  const oAuthService = inject(OAuthService);
  const errorHandler = inject(OAuthResourceServerErrorHandler);
  const moduleConfig = inject(OAuthModuleConfig, { optional: true });

  return interceptFn(oAuthService, errorHandler, moduleConfig, request, next);
}

/**
 * @deprecated
 *
 * Since Angular v14, and thanks to the fact that inject function can be call outside an injection context
 * we can create interceptor as a function
 *
 * As the package don't import the HttpClientModule or provide the HttpClient thanks to provideHttpClient.
 *
 * Currently, to benefit of the DefaultOAuthInterceptor we must add provideHttpClient(withInterceptorFromDI()).
 * This looks like a little bit as a "Black Box"
 *
 * Moreover HttpClientModule is deprecated, that force the user to use provideHttpClient function
 *
 * Use the function defaultOAuthInterceptor instead
 */
@Injectable()
export class DefaultOAuthInterceptor implements HttpInterceptor {
  constructor(
    private oAuthService: OAuthService,
    private errorHandler: OAuthResourceServerErrorHandler,
    @Optional() private moduleConfig: OAuthModuleConfig
  ) {}

  public intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return interceptFn(
      this.oAuthService,
      this.errorHandler,
      this.moduleConfig,
      req,
      next
    );
  }
}
