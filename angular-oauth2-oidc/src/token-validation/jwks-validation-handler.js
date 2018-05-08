"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var validation_handler_1 = require("./validation-handler");
var rs = require('jsrsasign');
/**
 * Validates the signature of an id_token against one
 * of the keys of an JSON Web Key Set (jwks).
 *
 * This jwks can be provided by the discovery document.
*/
var JwksValidationHandler = /** @class */ (function (_super) {
    __extends(JwksValidationHandler, _super);
    function JwksValidationHandler() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Allowed algorithms
         */
        _this.allowedAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'PS256', 'PS384', 'PS512'];
        /**
         * Time period in seconds the timestamp in the signature can
         * differ from the current time.
         */
        _this.gracePeriodInSec = 600;
        return _this;
    }
    JwksValidationHandler.prototype.validateSignature = function (params, retry) {
        var _this = this;
        if (retry === void 0) { retry = false; }
        if (!params.idToken)
            throw new Error('Parameter idToken expected!');
        if (!params.idTokenHeader)
            throw new Error('Parameter idTokenHandler expected.');
        if (!params.jwks)
            throw new Error('Parameter jwks expected!');
        if (!params.jwks['keys'] || !Array.isArray(params.jwks['keys']) || params.jwks['keys'].length === 0) {
            throw new Error('Array keys in jwks missing!');
        }
        // console.debug('validateSignature: retry', retry);
        var kid = params.idTokenHeader['kid'];
        var keys = params.jwks['keys'];
        var key;
        var alg = params.idTokenHeader['alg'];
        if (kid) {
            key = keys.find(function (k) { return k['kid'] === kid; } /* && k['use'] === 'sig' */);
        }
        else {
            var kty_1 = this.alg2kty(alg);
            var matchingKeys = keys.filter(function (k) { return k['kty'] === kty_1 && k['use'] === 'sig'; });
            /*
            if (matchingKeys.length == 0) {
                let error = 'No matching key found.';
                console.error(error);
                return Promise.reject(error);
            }*/
            if (matchingKeys.length > 1) {
                var error = 'More than one matching key found. Please specify a kid in the id_token header.';
                console.error(error);
                return Promise.reject(error);
            }
            else if (matchingKeys.length === 1) {
                key = matchingKeys[0];
            }
        }
        if (!key && !retry && params.loadKeys) {
            return params
                .loadKeys()
                .then(function (loadedKeys) { return params.jwks = loadedKeys; })
                .then(function (_) { return _this.validateSignature(params, true); });
        }
        if (!key && retry && !kid) {
            var error = 'No matching key found.';
            console.error(error);
            return Promise.reject(error);
        }
        if (!key && retry && kid) {
            var error = 'expected key not found in property jwks. '
                + 'This property is most likely loaded with the '
                + 'discovery document. '
                + 'Expected key id (kid): ' + kid;
            console.error(error);
            return Promise.reject(error);
        }
        var keyObj = rs.KEYUTIL.getKey(key);
        var validationOptions = {
            alg: this.allowedAlgorithms,
            gracePeriod: this.gracePeriodInSec
        };
        var isValid = rs.KJUR.jws.JWS.verifyJWT(params.idToken, keyObj, validationOptions);
        if (isValid) {
            return Promise.resolve();
        }
        else {
            return Promise.reject('Signature not valid');
        }
    };
    JwksValidationHandler.prototype.alg2kty = function (alg) {
        switch (alg.charAt(0)) {
            case 'R': return 'RSA';
            case 'E': return 'EC';
            default: throw new Error('Cannot infer kty from alg: ' + alg);
        }
    };
    JwksValidationHandler.prototype.calcHash = function (valueToHash, algorithm) {
        var hashAlg = new rs.KJUR.crypto.MessageDigest({ alg: algorithm });
        var result = hashAlg.digestString(valueToHash);
        var byteArrayAsString = this.toByteArrayAsString(result);
        return byteArrayAsString;
    };
    JwksValidationHandler.prototype.toByteArrayAsString = function (hexString) {
        var result = '';
        for (var i = 0; i < hexString.length; i += 2) {
            var hexDigit = hexString.charAt(i) + hexString.charAt(i + 1);
            var num = parseInt(hexDigit, 16);
            result += String.fromCharCode(num);
        }
        return result;
    };
    return JwksValidationHandler;
}(validation_handler_1.AbstractValidationHandler));
exports.JwksValidationHandler = JwksValidationHandler;
