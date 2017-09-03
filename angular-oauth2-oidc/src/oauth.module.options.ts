import { ValidationHandler } from './token-validation/validation-handler';
import { OAuthStorage } from './types';
import { Type } from '@angular/core';

/**
 * Used to configure the OAuthModule when
 * calling forRoot.
 */
export interface OAuthModuleOptions {
       validationHandler?: Type<ValidationHandler>;
       storage?: Type<OAuthStorage>;
}
