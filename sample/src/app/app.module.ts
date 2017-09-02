import {AppComponent} from "./app.component";
import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BASE_URL} from "./app.tokens";
import {SharedModule} from "./shared/shared.module";
import {AppRouterModule} from "./app.routes";
import {HomeComponent} from "./home/home.component";
import {FlightHistoryComponent} from "./flight-history/flight-history.component";
import { OAuthModule, ValidationHandler, JwksValidationHandler, OAuthStorage } from 'angular-oauth2-oidc';
import { DemoStorage } from './demo-storage';

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
