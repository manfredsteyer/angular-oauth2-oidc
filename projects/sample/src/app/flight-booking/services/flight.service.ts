import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../../app.tokens';
import { Observable } from 'rxjs';
import { Flight } from '../../entities/flight';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable()
export class FlightService {
  constructor(
    private oauthService: OAuthService,
    private http: HttpClient,
    @Inject(BASE_URL) private baseUrl: string
  ) {}

  public flights: Array<Flight> = [];

  find(from: string, to: string): void {
    let url = this.baseUrl + '/api/flight';
    let headers = new HttpHeaders().set('Accept', 'application/json');
    //.set('Authorization', 'Bearer ' + this.oauthService.getAccessToken());

    let params = new HttpParams().set('from', from).set('to', to);

    this.http
      .get<Flight[]>(url, { headers, params })
      .subscribe(
        flights => {
          this.flights = flights;
        },
        err => {
          console.warn('status', err.status);
        }
      );
  }
}
