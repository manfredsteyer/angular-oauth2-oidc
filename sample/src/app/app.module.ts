import { authConfig } from './auth.config';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {AuthConfig, JwksValidationHandler, OAuthModule, ValidationHandler} from 'angular-oauth2-oidc';

import {AppComponent} from './app.component';
import {AppRouterModule} from './app.routes';
import {BASE_URL} from './app.tokens';
import {FlightHistoryComponent} from './flight-history/flight-history.component';
import {HomeComponent} from './home/home.component';
import {PasswordFlowLoginComponent} from './password-flow-login/password-flow-login.component';
import {SharedModule} from './shared/shared.module';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule.forRoot(),
        AppRouterModule,
        HttpClientModule,
        OAuthModule.forRoot(
            {
            resourceServer: {
                allowedUrls: ['http://www.angular.at/api'],
                sendAccessToken: true
            }
        }
    )
    ],
    declarations: [
        AppComponent,
        HomeComponent,
        FlightHistoryComponent,
        PasswordFlowLoginComponent
    ],
    providers: [
        // {provide: AuthConfig, useValue: authConfig },
        // { provide: OAuthStorage, useClass: DemoStorage },
        // { provide: ValidationHandler, useClass: JwksValidationHandler },
        { provide: BASE_URL, useValue: "http://www.angular.at" }
    ],
    bootstrap: [
        AppComponent

    ]
})
export class AppModule {
}
