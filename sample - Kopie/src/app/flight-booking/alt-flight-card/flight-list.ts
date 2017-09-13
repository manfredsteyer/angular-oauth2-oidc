
import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Flight} from "../../entities/flight";
@Component({
    selector: 'flight-list',
    template: `
        <div class="row">
            <div *ngFor="let f of flights" class="col-sm-6 col-md-4 col-lg-3 ">
                <alt-flight-card 
                             [item]="f"
                             [selected]="f == selectedFlight"
                             (selectedChange)="change(f)">
                </alt-flight-card>
            </div>
        </div>    
    `
})
export class FlightListComponent {

    @Input() flights: Flight[] = [];
    @Input() selectedFlight: Flight;
    @Output() selectedFlightChange = new EventEmitter();

    change(f: Flight) {
        this.selectedFlightChange.emit(f);
    }

}
