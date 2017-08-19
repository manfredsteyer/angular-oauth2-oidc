import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
    template: `
        <h1>Flight Edit!</h1>
        <p>Hier könnte auch der Datensatz mit der Id {{id}} stehen!</p>
        
        <div *ngIf="exitWarning.show" class="alert alert-warning">
        <div>
        Daten wurden nicht gespeichert! Trotzdem Maske verlassen?
        </div>
        <div>
            <a href="javascript:void(0)" (click)="decide(true)" class="btn btn-danger">Ja</a>
            <a href="javascript:void(0)" (click)="decide(false)" class="btn btn-default">Nein</a>
        </div>
        </div>



        
    `
})
export class FlightEditComponent implements OnInit {

    public id: string;

    constructor(private route: ActivatedRoute) {

        route.params.subscribe(p => {
            this.id = p['id'];
        });
    }

    ngOnInit() { }

    exitWarning = {
        show: false,
        resolve: null
    }

    decide(decision: boolean) {
        this.exitWarning.show = false;
        this.exitWarning.resolve(decision);
    }

    canDeactivate() {
        this.exitWarning.show = true;
        return new Promise((resolve) => {
            this.exitWarning.resolve = resolve;
        });
    }

}