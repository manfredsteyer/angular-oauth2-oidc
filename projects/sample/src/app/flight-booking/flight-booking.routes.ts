import { inject } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { PassengerSearchComponent } from './passenger-search/passenger-search.component';
import { FlightEditComponent } from './flight-edit/flight-edit.component';
import { FlightBookingComponent } from './flight-booking.component';
import { AuthGuard } from '../shared/auth/auth.guard';

let FLIGHT_BOOKING_ROUTES: Routes = [
  {
    path: '',
    component: FlightBookingComponent,
    canActivate: [() => inject(AuthGuard).canActivate()],
    children: [
      {
        path: 'flight-search',
        component: FlightSearchComponent,
      },
      {
        path: 'passenger-search',
        component: PassengerSearchComponent,
      },
      {
        path: 'flight-edit/:id',
        component: FlightEditComponent,
        canDeactivate: [
          (component: FlightEditComponent) => component.canDeactivate(),
        ],
      },
    ],
  },
];

export let FlightBookingRouterModule = RouterModule.forChild(
  FLIGHT_BOOKING_ROUTES
);
