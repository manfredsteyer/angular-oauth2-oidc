import { Injectable, Inject, Optional } from '@angular/core';
import { OAuthService } from '../oauth-service';
import { OAuthStorage } from '../types';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OAuthResourceServerErrorHandler } from "./resource-server-error-handler";
import { OAuthModuleConfig } from "../oauth-module.config";

import 'rxjs/add/operator/catch';

@Injectable()
export class DefaultOAuthInterceptor implements HttpInterceptor {

    constructor(
        private authStorage: OAuthStorage,
        private errorHandler: OAuthResourceServerErrorHandler,
        @Optional() private moduleConfig: OAuthModuleConfig
    ) {
    }

    private checkUrl(url: string): boolean {
        let found = this.moduleConfig.resourceServer.allowedUrls.find(u => url.startsWith(u));
        return !!found;
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let url = req.url.toLowerCase();

        if (!this.moduleConfig) return next.handle(req);
        if (!this.moduleConfig.resourceServer) return next.handle(req);
        if (!this.moduleConfig.resourceServer.allowedUrls) return next.handle(req);
        if (!this.checkUrl(url)) return next.handle(req);

        let sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;

        if (sendAccessToken && this.authStorage.getItem('access_token')) {

            let token = this.authStorage.getItem('access_token');
            let header = 'Bearer ' + token;

            let headers = req.headers
                .set('Authorization', header);

            req = req.clone({ headers });
        }

<<<<<<< HEAD
        return next.handle(req).catch(err => this.errorHandler.handleError(err));

=======
        return next.handle(req).pipe(
            catchError(err => this.errorHandler.handleError(err))
        );
>>>>>>> f0791bd3be17128862b73004a308a2c21488626c
    }
}