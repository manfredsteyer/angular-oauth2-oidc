import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Flight } from '../../entities/flight';

@Component({
  selector: 'app-flight-list',
  template: `
        <div class="row">
            <div *ngFor="let f of flights" class="col-sm-6 col-md-4 col-lg-3 ">
                <app-alt-flight-card
                             [item]="f"
                             [selected]="f === selectedFlight"
                             (selectedChange)="change(f)">
                </app-alt-flight-card>
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
