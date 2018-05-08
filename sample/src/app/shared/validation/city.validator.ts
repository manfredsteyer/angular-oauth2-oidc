
import {Directive, Input, Attribute} from '@angular/core';
import {NG_VALIDATORS, Validator, AbstractControl, FormGroup} from '@angular/forms';

@Directive({
    selector: 'input[city]', // tslint:disable-line directive-selector
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: CityValidatorDirective,
            multi: true
        }
    ]
})
export class CityValidatorDirective implements Validator {

    // @Input() city: string;

    constructor(@Attribute('city') private city: string) {
    }

    validate(c: AbstractControl): any {


        const formGroup = <FormGroup>c.root;
        const otherValueCtrl = formGroup.controls['to'];

        if (!otherValueCtrl) { return { }; }

        const otherValue = otherValueCtrl.value;

        if (otherValue === c.value) {
            return {
                city: 'rundflug'
            };
        }

        if (!this.city) { return { }; }

        const allowed = this.city.split(','); // ['Graz', 'Hamburg', 'Wien', 'Frankfurt'];

        if (allowed.indexOf(c.value) === -1) {
            return {
                city: true
            };
        }

        return {};

    }
}
