import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService } from './oauth-service';
import { UrlHelperService } from './url-helper.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/publish';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/race';

export * from './oauth-service';
export * from './token-validation/jwks-validation-handler';
export * from './token-validation/null-validation-handler';
export * from './token-validation/validation-handler';
export * from './url-helper.service';
export * from './auth.config';
export * from './types';
export * from './tokens';

@NgModule({
  imports: [
    CommonModule,
    //HttpModule
  ],
  declarations: [
  ],
  exports: [
  ]
})
export class OAuthModule {

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: OAuthModule,
      providers: [
        OAuthService,
        UrlHelperService
      ]
    };
  }
}
