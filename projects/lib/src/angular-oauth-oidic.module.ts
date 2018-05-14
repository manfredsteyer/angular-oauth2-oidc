import { OAuthStorage } from './types';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { OAuthService } from './oauth-service';
import { UrlHelperService } from './url-helper.service';

import { OAuthModuleConfig } from './oauth-module.config';
import {
  OAuthResourceServerErrorHandler,
  OAuthNoopResourceServerErrorHandler
} from './interceptors/resource-server-error-handler';
import { DefaultOAuthInterceptor } from './interceptors/default-oauth.interceptor';
import { ValidationHandler } from './token-validation/validation-handler';
import { NullValidationHandler } from './token-validation/null-validation-handler';

export function createDefaultStorage() {
  return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
}

@NgModule({
  imports: [CommonModule],
  declarations: [],
  exports: []
})
export class OAuthModule {
  static forRoot(
    config: OAuthModuleConfig = null,
    validationHandlerClass = NullValidationHandler
  ): ModuleWithProviders {
    // const setupInterceptor = config && config.resourceServer && config.resourceServer.allowedUrls;

    return {
      ngModule: OAuthModule,
      providers: [
        OAuthService,
        UrlHelperService,
        { provide: OAuthStorage, useFactory: createDefaultStorage },
        { provide: ValidationHandler, useClass: validationHandlerClass},
        {
          provide: OAuthResourceServerErrorHandler,
          useClass: OAuthNoopResourceServerErrorHandler
        },
        { provide: OAuthModuleConfig, useValue: config },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: DefaultOAuthInterceptor,
          multi: true
        }
      ]
    };
  }
}
