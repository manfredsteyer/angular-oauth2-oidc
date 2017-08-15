import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService } from './oauth-service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/publish';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/race';

export * from "./oauth-service";
export * from './token-validation/jwks-validation-handler';
export * from './token-validation/null-validation-handler';
export * from './token-validation/validation-handler';

import { UrlHelperService } from "./url-helper.service";

@NgModule({
  imports: [
    CommonModule
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
