import { AbstractValidationHandler, ValidationParams } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from './jwks-validation-handler';

describe('JwksValidationHandler', () => {
  let handler: JwksValidationHandler;

  beforeEach(() => {
    handler = new JwksValidationHandler();
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
    expect(handler instanceof AbstractValidationHandler).toBe(true);
  });

  it('should allow the common JOSE signing algorithms by default', () => {
    expect(handler.allowedAlgorithms).toContain('RS256');
    expect(handler.allowedAlgorithms).toContain('ES256');
    expect(handler.allowedAlgorithms).toContain('HS256');
  });

  it('should throw if no idToken is given', () => {
    expect(() =>
      handler.validateSignature({} as ValidationParams)
    ).toThrowError('Parameter idToken expected!');
  });

  it('should throw if no idTokenHeader is given', () => {
    expect(() =>
      handler.validateSignature({ idToken: 'abc' } as ValidationParams)
    ).toThrowError('Parameter idTokenHandler expected.');
  });

  it('should throw if no jwks is given', () => {
    expect(() =>
      handler.validateSignature({
        idToken: 'abc',
        idTokenHeader: { alg: 'RS256' },
      } as ValidationParams)
    ).toThrowError('Parameter jwks expected!');
  });

  it('should throw if jwks contains no keys', () => {
    expect(() =>
      handler.validateSignature({
        idToken: 'abc',
        idTokenHeader: { alg: 'RS256' },
        jwks: { keys: [] },
      } as unknown as ValidationParams)
    ).toThrowError('Array keys in jwks missing!');
  });
});
