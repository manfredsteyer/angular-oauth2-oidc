import { Component, OnInit } from '@angular/core';
import { OAuthService } from "angular-oauth2-oidc";

@Component({
    template: `
        <h1>PassengerSearch</h1>
        <p>Platzhalter-Seite. Hier könnte auch Ihre Werbung stehen ;-)</p>
        <p><button (click)="refresh()">Refresh</button></p>

    `
})
export class PassengerSearchComponent implements OnInit {
    constructor(private oauthService: OAuthService) { }
    ngOnInit() { }

    refresh() {
        this.oauthService.silentRefresh();
    }
}
