import { OAuthService } from './src/oauth-service';
import { NgModule, ModuleWithProviders } from "@angular/core";
import { CommonModule } from "@angular/common";

export * from './src/oauth-service';

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
      providers: [OAuthService]
    };
  }
}
