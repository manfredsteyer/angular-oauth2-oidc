import { Component } from '@angular/core';
import {Flight} from "../../entities/flight";
import {Http, URLSearchParams, Headers } from '@angular/http';
import {FlightService} from "../services/flight.service";

@Component({
    selector: 'flight-search',
    templateUrl: './flight-search.component.html',
    styleUrls: ['./flight-search.component.css']
})
export class FlightSearchComponent {

    public from: string = "Graz";
    public to: string = "";
    public selectedFlight: Flight;

    constructor(private flightService: FlightService) {
    }

    // cmp.flights
    public get flights() {
        return this.flightService.flights;
    }

    public select(f: Flight): void {
        this.selectedFlight = f;
    }

    public search(): void {

        this.flightService
            .find(this.from, this.to);

            // .map(function(resp) { return resp.json() })

    }
}