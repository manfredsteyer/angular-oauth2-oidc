"use strict";
exports.__esModule = true;
/**
 * Interface for Handlers that are hooked in to
 * validate tokens.
 */
var /**
 * Interface for Handlers that are hooked in to
 * validate tokens.
 */
ValidationHandler = /** @class */ (function () {
    function ValidationHandler() {
    }
    return ValidationHandler;
}());
exports.ValidationHandler = ValidationHandler;
/**
 * This abstract implementation of ValidationHandler already implements
 * the method validateAtHash. However, to make use of it,
 * you have to override the method calcHash.
*/
var /**
 * This abstract implementation of ValidationHandler already implements
 * the method validateAtHash. However, to make use of it,
 * you have to override the method calcHash.
*/
AbstractValidationHandler = /** @class */ (function () {
    function AbstractValidationHandler() {
    }
    /**
     * Validates the at_hash in an id_token against the received access_token.
     */
    /**
         * Validates the at_hash in an id_token against the received access_token.
         */
    AbstractValidationHandler.prototype.validateAtHash = /**
         * Validates the at_hash in an id_token against the received access_token.
         */
    function (params) {
        var hashAlg = this.inferHashAlgorithm(params.idTokenHeader);
        var tokenHash = this.calcHash(params.accessToken, hashAlg); // sha256(accessToken, { asString: true });
        var leftMostHalf = tokenHash.substr(0, tokenHash.length / 2);
        var tokenHashBase64 = btoa(leftMostHalf);
        var atHash = tokenHashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        var claimsAtHash = params.idTokenClaims['at_hash'].replace(/=/g, '');
        if (atHash !== claimsAtHash) {
            console.error('exptected at_hash: ' + atHash);
            console.error('actual at_hash: ' + claimsAtHash);
        }
        return (atHash === claimsAtHash);
    };
    /**
     * Infers the name of the hash algorithm to use
     * from the alg field of an id_token.
     *
     * @param jwtHeader the id_token's parsed header
     */
    /**
         * Infers the name of the hash algorithm to use
         * from the alg field of an id_token.
         *
         * @param jwtHeader the id_token's parsed header
         */
    AbstractValidationHandler.prototype.inferHashAlgorithm = /**
         * Infers the name of the hash algorithm to use
         * from the alg field of an id_token.
         *
         * @param jwtHeader the id_token's parsed header
         */
    function (jwtHeader) {
        var alg = jwtHeader['alg'];
        if (!alg.match(/^.S[0-9]{3}$/)) {
            throw new Error('Algorithm not supported: ' + alg);
        }
        return 'sha' + alg.substr(2);
    };
    return AbstractValidationHandler;
}());
exports.AbstractValidationHandler = AbstractValidationHandler;
