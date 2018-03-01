import { OAuthStorage } from './types';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthService } from './oauth-service';
import { UrlHelperService } from './url-helper.service';
import { OAuthModuleConfig } from './oauth-module.config';
import {
  OAuthResourceServerErrorHandler,
  OAuthNoopResourceServerErrorHandler
} from './interceptors/resource-server-error-handler';
import { DefaultOAuthInterceptor } from './interceptors/default-oauth.interceptor';

export function createDefaultStorage() {
  return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
}

@NgModule({
  imports: [CommonModule],
  declarations: [],
  exports: []
})
export class OAuthModule {
  static forRoot(config: OAuthModuleConfig = null): ModuleWithProviders {
    return {
      ngModule: OAuthModule,
      providers: [
        OAuthService,
        UrlHelperService,
        { provide: OAuthStorage, useFactory: createDefaultStorage },
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
