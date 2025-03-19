import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { defaultOAuthInterceptor, OAuthModule } from 'angular-oauth2-oidc';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [BrowserModule, OAuthModule.forRoot()],
  providers: [provideHttpClient(withInterceptors([defaultOAuthInterceptor]))],
})
export class AppModule {}
