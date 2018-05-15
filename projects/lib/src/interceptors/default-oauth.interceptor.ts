import { Injectable, Inject, Optional } from '@angular/core';
import { OAuthService } from '../oauth-service';
import { OAuthStorage } from '../types';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OAuthResourceServerErrorHandler } from './resource-server-error-handler';
import { OAuthModuleConfig } from '../oauth-module.config';

@Injectable()
export class DefaultOAuthInterceptor implements HttpInterceptor {
    constructor(
        private authStorage: OAuthStorage,
        private errorHandler: OAuthResourceServerErrorHandler,
        @Optional() private moduleConfig: OAuthModuleConfig
    ) { }

    private checkUrl(url: string): boolean {
        const found = this.moduleConfig.resourceServer.allowedUrls.find(u => url.startsWith(u));
        return !!found;
    }

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const url = req.url.toLowerCase();

        if (!this.moduleConfig) {
            return next.handle(req);
        }
        if (!this.moduleConfig.resourceServer) {
            return next.handle(req);
        }
        if (this.moduleConfig.resourceServer.allowedUrls && !this.checkUrl(url)) {
            return next.handle(req);
        }

        const sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;

        if (sendAccessToken && this.authStorage.getItem('access_token')) {
            const token = this.authStorage.getItem('access_token');
            const header = 'Bearer ' + token;

            const headers = req.headers.set('Authorization', header);

            req = req.clone({ headers });
        }

        return next
            .handle(req)
            .pipe(catchError(err => this.errorHandler.handleError(err)));
    }
}
