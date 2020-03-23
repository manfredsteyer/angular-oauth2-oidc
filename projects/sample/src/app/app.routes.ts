import { PasswordFlowLoginComponent } from './password-flow-login/password-flow-login.component';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FlightHistoryComponent } from './flight-history/flight-history.component';

export let APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'password-flow-login',
    component: PasswordFlowLoginComponent
  },
  {
    path: 'flight-booking',
    loadChildren: () =>
      import('./flight-booking/flight-booking.module').then(
        mod => mod.FlightBookingModule
      )
  },
  {
    path: 'history',
    component: FlightHistoryComponent,
    outlet: 'aux'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
