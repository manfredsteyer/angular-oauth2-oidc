import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {AUTH_CONFIG, JwksValidationHandler, OAuthModule, OAuthStorage, ValidationHandler} from 'angular-oauth2-oidc';

import {AppComponent} from './app.component';
import {AppRouterModule} from './app.routes';
import {BASE_URL} from './app.tokens';
import {DemoStorage} from './demo-storage';
import {FlightHistoryComponent} from './flight-history/flight-history.component';
import {HomeComponent} from './home/home.component';
import {SharedModule} from './shared/shared.module';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule.forRoot(),
        AppRouterModule,

        OAuthModule.forRoot()
    ],
    declarations: [
        AppComponent,
        HomeComponent,
        FlightHistoryComponent
    ],
    providers: [
        // {provide: AUTH_CONFIG, useValue: authConfig },
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
