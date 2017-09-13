import {NgModule, ModuleWithProviders} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {CityPipe} from "./pipes/city.pipe";
import {CityValidatorDirective} from "./validation/city.validator";
import {RoundTrip} from "./validation/roundtrip.validator";
import {AsyncCityValidatorDirective} from "./validation/async-city.validator";
import {DateComponent} from "./date/date.component";
import {AuthGuard} from "./auth/auth.guard";
import {LeaveComponentGuard} from "./deactivation/LeaveComponentGuard";
import {CustomPreloadingStrategy} from "./preload/custom-preloading.strategy";

@NgModule({
    imports: [
        FormsModule, // [(ngModel)]
        CommonModule // ngFor, ngIf, ngStyle, ngClass, date, json
    ],
    providers: [
    ],
    declarations: [
        CityPipe,
        CityValidatorDirective,
        AsyncCityValidatorDirective,
        RoundTrip,
        DateComponent
    ],
    exports:[
        CityPipe,
        CityValidatorDirective,
        AsyncCityValidatorDirective,
        RoundTrip,
        DateComponent
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            providers: [
                AuthGuard,
                LeaveComponentGuard,
                CustomPreloadingStrategy
            ],
            ngModule: SharedModule
        };
    }
}