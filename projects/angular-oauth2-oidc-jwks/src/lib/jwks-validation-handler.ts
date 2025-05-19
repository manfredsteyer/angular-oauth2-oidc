import * as rs from 'jsrsasign';
import {
  AbstractValidationHandler,
  DateTimeProvider,
  ValidationParams,
} from 'angular-oauth2-oidc';
import { Injector } from '@angular/core';

/**
 * Validates the signature of an id_token against one
 * of the keys of an JSON Web Key Set (jwks).
 *
 * This jwks can be provided by the discovery document.
 */
export class JwksValidationHandler extends AbstractValidationHandler {
  constructor(
    private injector?: Injector,
    private validationOptions?: () => object
  ) {
    super();
  }
  /**
   * Allowed algorithms
   */
  allowedAlgorithms: string[] = [
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'ES256',
    'ES384',
    'PS256',
    'PS384',
    'PS512',
  ];

  /**
   * Time period in seconds the timestamp in the signature can
   * differ from the current time.
   */
  gracePeriodInSec = 600;

  validateSignature(params: ValidationParams, retry = false): Promise<any> {
    if (!params.idToken) throw new Error('Parameter idToken expected!');
    if (!params.idTokenHeader)
      throw new Error('Parameter idTokenHandler expected.');
    if (!params.jwks) throw new Error('Parameter jwks expected!');

    if (
      !params.jwks['keys'] ||
      !Array.isArray(params.jwks['keys']) ||
      params.jwks['keys'].length === 0
    ) {
      throw new Error('Array keys in jwks missing!');
    }

    // console.debug('validateSignature: retry', retry);

    const kid: string = params.idTokenHeader['kid'];
    const keys: object[] = params.jwks['keys'];
    let key: object;

    const alg = params.idTokenHeader['alg'];

    if (kid) {
      key = keys.find((k) => k['kid'] === kid /* && k['use'] === 'sig' */);
    } else {
      const kty = this.alg2kty(alg);
      const matchingKeys = keys.filter(
        (k) => k['kty'] === kty && k['use'] === 'sig'
      );

      /*
            if (matchingKeys.length == 0) {
                let error = 'No matching key found.';
                console.error(error);
                return Promise.reject(error);
            }*/
      if (matchingKeys.length > 1) {
        const error =
          'More than one matching key found. Please specify a kid in the id_token header.';
        console.error(error);
        return Promise.reject(error);
      } else if (matchingKeys.length === 1) {
        key = matchingKeys[0];
      }
    }

    if (!key && !retry && params.loadKeys) {
      return params
        .loadKeys()
        .then((loadedKeys) => (params.jwks = loadedKeys))
        .then((_) => this.validateSignature(params, true));
    }

    if (!key && retry && !kid) {
      const error = 'No matching key found.';
      console.error(error);
      return Promise.reject(error);
    }

    if (!key && retry && kid) {
      const error =
        'expected key not found in property jwks. ' +
        'This property is most likely loaded with the ' +
        'discovery document. ' +
        'Expected key id (kid): ' +
        kid;

      console.error(error);
      return Promise.reject(error);
    }

    const keyObj = this.getKey(key);
    const customValidationOptions = {
      ...(this.validationOptions ? this.validationOptions() : {}),
    };
    const validationOptions = {
      alg: this.allowedAlgorithms,
      gracePeriod: this.gracePeriodInSec,
      verifyAt: this.verifyAt,
      ...customValidationOptions,
    };

    const isValid = this.verifyJWT(params.idToken, keyObj, validationOptions);

    if (isValid) {
      return Promise.resolve();
    } else {
      return Promise.reject('Signature not valid');
    }
  }

  getKey(key: object) {
    return this.rs.KEYUTIL.getKey(key);
  }

  verifyJWT(idToken: string, keyObj: object, validationOptions: object) {
    return this.rs.KJUR.jws.JWS.verifyJWT(idToken, keyObj, validationOptions);
  }

  alg2kty(alg: string) {
    switch (alg.charAt(0)) {
      case 'R':
        return 'RSA';
      case 'E':
        return 'EC';
      default:
        throw new Error('Cannot infer kty from alg: ' + alg);
    }
  }

  calcHash(valueToHash: string, algorithm: string): Promise<string> {
    let hashAlg = new rs.KJUR.crypto.MessageDigest({ alg: algorithm });
    let result = hashAlg.digestString(valueToHash);
    let byteArrayAsString = this.toByteArrayAsString(result);
    return Promise.resolve(byteArrayAsString);
  }

  toByteArrayAsString(hexString: string) {
    let result = '';
    for (let i = 0; i < hexString.length; i += 2) {
      let hexDigit = hexString.charAt(i) + hexString.charAt(i + 1);
      let num = parseInt(hexDigit, 16);
      result += String.fromCharCode(num);
    }
    return result;
  }

  get rs() {
    return rs;
  }

  private get dateTimeProvider() {
    return this.injector?.get(DateTimeProvider);
  }

  private get verifyAt() {
    const now = this.dateTimeProvider?.new() || new Date();
    const verifyAt = Math.floor(now.getTime() / 1000);
    return verifyAt;
  }
}
