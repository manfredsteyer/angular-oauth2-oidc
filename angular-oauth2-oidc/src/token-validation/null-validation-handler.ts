import { ValidationHandler, ValidationParams } from './validation-handler';

/**
 * A validation handler that isn't validating nothing.
 * Can be used to skip validation (on your own risk).
 */
export class NullValidationHandler implements ValidationHandler {
    validateSignature(validationParams: ValidationParams): Promise<any> {
        return Promise.resolve(null);
    }
    validateAtHash(validationParams: ValidationParams): boolean {
        return true;
    }
}
