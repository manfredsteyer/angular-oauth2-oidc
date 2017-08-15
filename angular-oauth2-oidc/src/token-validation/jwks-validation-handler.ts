import { ValidationHandler, AbstractValidationHandler, ValidationParams } from "./validation-handler";

declare var require: any;
let rs = require('jsrsasign');

/**
 * Validates the signature of an id_token against one
 * of the keys of an JSON Web Key Set (jwks).
 * 
 * This jwks can be provided by the discovery document.
*/
export class JwksValidationHandler extends AbstractValidationHandler {
    
    /**
     * Allowed algorithms
     */
    allowedAlgorithms: string[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'PS256', 'PS384', 'PS512']
    
    /**
     * Time period in seconds the timestamp in the signature can
     * differ from the current time.
     */
    gracePeriodInSec: number = 600;

    validateSignature(params: ValidationParams): Promise<any> {
        if (!params.idToken) throw new Error('Parameter idToken expected!');
        if (!params.idTokenHeader) throw new Error('Parameter idTokenHandler expected.');
        if (!params.jwks) throw new Error('Parameter jwks expected!');
        
        if (!params.jwks['keys'] || !Array.isArray(params.jwks['keys']) || params.jwks['keys'].length == 0) {
            throw new Error('Array keys in jwks missing!');
        }

        let kid: string = params.idTokenHeader['kid'];
        let keys: object[] = params.jwks['keys'];
        let key: object;
        
        if (!kid && params.jwks['keys'].length > 1) {
            let error = 'Multiple keys but no kid in token!';
            console.error(error);
            return Promise.reject(error);
        }
        else if (!kid) {
            key = params.jwks['keys'][0];
        }
        else {
            key = keys.find(k => k['kid'] == kid && k['use'] == 'sig');
        }

        if (!key) {
            let error = 'expected key not found in property jwks. '
                            + 'This property is most likely loaded with the '
                            + 'discovery document. '
                            + 'Expected key id (kid): ' + kid;
    
            console.error(error);
            return Promise.reject(error);
        }
    
        let keyObj = rs.KEYUTIL.getKey(key);
        let isValid = rs.KJUR.jws.JWS.verifyJWT(params.idToken, keyObj, { alg: this.allowedAlgorithms, gracePeriod: this.gracePeriodInSec });
        
        if (isValid) {
            return Promise.resolve();
        }
        else {
            return Promise.reject('Signature not valid');
        }
    }

    calcHash(valueToHash: string, algorithm: string): string {
        let hashAlg = new rs.KJUR.crypto.MessageDigest({alg: algorithm});
        let result = hashAlg.digestString(valueToHash);
        let byteArrayAsString = this.toByteArrayAsString(result);
        return byteArrayAsString;
    }

    toByteArrayAsString(hexString: string) {
        let result: string = "";
        for(let i=0; i<hexString.length; i+=2) {
            let hexDigit = hexString.charAt(i) + hexString.charAt(i+1);
            let num = parseInt(hexDigit, 16);
            result += String.fromCharCode(num);
        }
        return result;
    }

}

