import {Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'city',
    pure: true
})
export class CityPipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {

        let fmt = args[0]; // short, long
        let short, long;

        switch(value) {
            case "Graz":
                long = "Flughafen Graz Thalerhof";
                short = "GRZ";
                break;
            case "Hamburg":
                long = "Airport Hamburg Fuhlsbüttl Helmut Schmidt";
                short = "HAM";
                break;
            default:
                long = short = "ROM";
        }

        if (fmt == 'short') return short;
        return long;

    }



}