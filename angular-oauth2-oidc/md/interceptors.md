# Interceptors

Since 3.1 the library uses a default HttpInterceptor that takes care about transmitting the access_token to the resource server and about error handling for security related errors (HTTP status codes 401 and 403) received from the resource server. To put in on, just set ``sendAccessToken`` to ``true`` and set ``allowedUrls`` to an array with prefixes for the respective urls. Use lower case for the prefixes:

```TypeScript
OAuthModule.forRoot({
    resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true
    }
})
```

You can provide an error handler for the urls white listed here by provding a service for the token ``OAuthResourceServerErrorHandler``.

To implement such a service, implement the abstract class ``OAuthResourceServerErrorHandler``. The following example shows the default implemantion that just passes the cought error through:

```TypeScript
export class OAuthNoopResourceServerErrorHandler implements OAuthResourceServerErrorHandler {
    
    handleError(err: HttpResponse<any>): Observable<any> {
        return _throw(err);
    }

}
```

## Custom Interceptors

Feel free to write custom interceptors but keep in mind that injecting the ``OAuthService`` into them creates a circular dependency which leads to an error. The easiest way to prevent this is to use the OAuthStorage directly which also provides the access_token:

```TypeScript
import { Injectable, Inject, Optional } from '@angular/core';
import { OAuthService, OAuthStorage } from 'angular-oauth2-oidc';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
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
        
        if (sendAccessToken) {

            let token = this.authStorage.getItem('access_token');
            let header = 'Bearer ' + token;

            let headers = req.headers
                                .set('Authorization', header);

            req = req.clone({ headers });
        }

        return next.handle(req).catch(err => this.errorHandler.handleError(err));

    }

}
```