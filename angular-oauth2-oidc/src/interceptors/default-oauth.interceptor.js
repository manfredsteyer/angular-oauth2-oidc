"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var operators_1 = require("rxjs/operators");
var DefaultOAuthInterceptor = /** @class */ (function () {
    function DefaultOAuthInterceptor(authStorage, errorHandler, moduleConfig) {
        this.authStorage = authStorage;
        this.errorHandler = errorHandler;
        this.moduleConfig = moduleConfig;
    }
    DefaultOAuthInterceptor.prototype.checkUrl = function (url) {
        var found = this.moduleConfig.resourceServer.allowedUrls.find(function (u) { return url.startsWith(u); });
        return !!found;
    };
    DefaultOAuthInterceptor.prototype.intercept = function (req, next) {
        var _this = this;
        var url = req.url.toLowerCase();
        if (!this.moduleConfig)
            return next.handle(req);
        if (!this.moduleConfig.resourceServer)
            return next.handle(req);
        if (!this.moduleConfig.resourceServer.allowedUrls)
            return next.handle(req);
        if (!this.checkUrl(url))
            return next.handle(req);
        var sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;
        if (sendAccessToken) {
            var token = this.authStorage.getItem('access_token');
            var header = 'Bearer ' + token;
            var headers = req.headers
                .set('Authorization', header);
            req = req.clone({ headers: headers });
        }
        return next.handle(req).pipe(operators_1.catchError(function (err) { return _this.errorHandler.handleError(err); }));
    };
    DefaultOAuthInterceptor = __decorate([
        core_1.Injectable(),
        __param(2, core_1.Optional())
    ], DefaultOAuthInterceptor);
    return DefaultOAuthInterceptor;
}());
exports.DefaultOAuthInterceptor = DefaultOAuthInterceptor;
