import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { OAuthModule } from 'angular-oauth2-oidc';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AppComponent } from './app.component';
import { APP_ROUTES } from './app.routes';
import { BASE_URL } from './app.tokens';
import { FlightHistoryComponent } from './flight-history/flight-history.component';
import { HomeComponent } from './home/home.component';
import { PasswordFlowLoginComponent } from './password-flow-login/password-flow-login.component';
// import { CustomDateTimeProvider } from './shared/date/custom-date-time-provider';
import { SharedModule } from './shared/shared.module';
import { RouterModule } from '@angular/router';
import { useHash } from '../flags';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FlightHistoryComponent,
    PasswordFlowLoginComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(APP_ROUTES, { useHash }),
    FormsModule,
    ReactiveFormsModule,
    SharedModule.forRoot(),
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true,
      },
    }),
  ],
  providers: [
    // (useHash) ? { provide: LocationStrategy, useClass: HashLocationStrategy } : [],
    // {provide: AuthConfig, useValue: authConfig },
    // { provide: OAuthStorage, useValue: localStorage },
    // { provide: ValidationHandler, useClass: JwksValidationHandler },
    // Enabled the custom date time provider will make the sample fail to login, since the demo Idp time is correctly synced to the world time.
    // { provide: DateTimeProvider, useClass: CustomDateTimeProvider },
    { provide: BASE_URL, useValue: 'http://www.angular.at' },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
