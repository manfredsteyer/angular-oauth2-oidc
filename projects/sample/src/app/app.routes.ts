import { PasswordFlowLoginComponent } from './password-flow-login/password-flow-login.component';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FlightHistoryComponent } from './flight-history/flight-history.component';
import { CustomPreloadingStrategy } from './shared/preload/custom-preloading.strategy';
import { FlightBookingModule } from './flight-booking/flight-booking.module';
import { CodeFlowComponent } from './code-flow/code-flow.component';

export let APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'code-flow',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'code-flow',
    component: CodeFlowComponent
  },
  {
    path: 'password-flow-login',
    component: PasswordFlowLoginComponent
  },
  {
    path: 'flight-booking',
    loadChildren: () => import('./flight-booking/flight-booking.module').then(mod => mod.FlightBookingModule)
  },
  {
    path: 'history',
    component: FlightHistoryComponent,
    outlet: 'aux'
  },
  {
    path: '**',
    redirectTo: 'code-flow'
  }
];

export let AppRouterModule = RouterModule.forRoot(APP_ROUTES, {
  preloadingStrategy: CustomPreloadingStrategy
  // useHash: true,
  // initialNavigation: false
});
