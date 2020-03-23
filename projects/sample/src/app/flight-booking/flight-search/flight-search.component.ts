import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Flight } from '../../entities/flight';
import { FlightService } from '../services/flight.service';

@Component({
  selector: 'flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.css']
})
export class FlightSearchComponent {
  public from: string = 'Graz';
  public to: string = '';
  public selectedFlight: Flight;

  constructor(
    private flightService: FlightService,
    private oauthService: OAuthService
  ) {
    console.debug('access-token', this.oauthService.getAccessToken());
  }

  // cmp.flights
  public get flights() {
    return this.flightService.flights;
  }

  public select(f: Flight): void {
    this.selectedFlight = f;
  }

  public search(): void {
    this.flightService.find(this.from, this.to);

    // .map(function(resp) { return resp.json() })
  }

  refresh() {
    this.oauthService.oidc = true;

    if (
      !this.oauthService.useSilentRefresh &&
      this.oauthService.responseType === 'code'
    ) {
      this.oauthService
        .refreshToken()
        .then(info => console.debug('refresh ok', info))
        .catch(err => console.error('refresh error', err));
    } else {
      this.oauthService
        .silentRefresh()
        .then(info => console.debug('silent refresh ok', info))
        .catch(err => console.error('silent refresh error', err));
    }
  }
}
