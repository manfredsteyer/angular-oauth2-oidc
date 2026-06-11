import { bootstrapApplication } from '@angular/platform-browser';

import { provideHttpClient, withXhr } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { provideOAuthClient } from 'angular-oauth2-oidc';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(withXhr()), provideOAuthClient()],
});
