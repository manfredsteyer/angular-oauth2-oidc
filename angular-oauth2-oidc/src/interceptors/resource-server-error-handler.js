"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var OAuthResourceServerErrorHandler = /** @class */ (function () {
    function OAuthResourceServerErrorHandler() {
    }
    return OAuthResourceServerErrorHandler;
}());
exports.OAuthResourceServerErrorHandler = OAuthResourceServerErrorHandler;
var OAuthNoopResourceServerErrorHandler = /** @class */ (function () {
    function OAuthNoopResourceServerErrorHandler() {
    }
    OAuthNoopResourceServerErrorHandler.prototype.handleError = function (err) {
        return rxjs_1.throwError(err);
    };
    return OAuthNoopResourceServerErrorHandler;
}());
exports.OAuthNoopResourceServerErrorHandler = OAuthNoopResourceServerErrorHandler;
