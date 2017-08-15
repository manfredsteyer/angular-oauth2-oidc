import {NgModule} from "@angular/core";
import {FlightSearchComponent} from "./flight-search/flight-search.component";
import {FlightCardComponent} from "./flight-card/flight.card.component";
import {AltFlightCardComponent} from "./alt-flight-card/alt-flight.card.component";
import {FlightListComponent} from "./alt-flight-card/flight-list";
import {PassengerSearchComponent} from "./passenger-search/passenger-search.component";
import {FlightEditComponent} from "./flight-edit/flight-edit.component";
import {FlightSearchReactiveComponent} from "./flight-search-reactive/flight-search-reactive.component";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import {FlightBookingRouterModule} from "./flight-booking.routes";
import {FlightBookingComponent} from "./flight-booking.component";
import {FlightService} from "./services/flight.service";

@NgModule({
    imports: [
        CommonModule, // ngFor
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        FlightBookingRouterModule
    ],
    declarations: [
        FlightSearchComponent,
        FlightCardComponent,
        AltFlightCardComponent,
        FlightListComponent,
        FlightSearchReactiveComponent,
        PassengerSearchComponent,
        FlightEditComponent,
        FlightBookingComponent
    ],
    providers: [
        FlightService
    ],
    exports: [
    ]
})
export class FlightBookingModule {

}