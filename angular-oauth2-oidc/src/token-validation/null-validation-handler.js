"use strict";
exports.__esModule = true;
/**
 * A validation handler that isn't validating nothing.
 * Can be used to skip validation (on your own risk).
 */
var NullValidationHandler = (function () {
    function NullValidationHandler() {
    }
    NullValidationHandler.prototype.validateSignature = function (validationParams) {
        return Promise.resolve(null);
    };
    NullValidationHandler.prototype.validateAtHash = function (validationParams) {
        return true;
    };
    return NullValidationHandler;
}());
exports.NullValidationHandler = NullValidationHandler;
