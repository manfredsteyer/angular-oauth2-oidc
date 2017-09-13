import {Directive} from "@angular/core";
import {FormGroup, Validator, AbstractControl, NG_VALIDATORS, FormGroupDirective} from "@angular/forms";

@Directive({
    selector: 'form[round-trip]',
    providers: [{ provide: NG_VALIDATORS, useExisting: RoundTrip, multi: true  }]
})
export class RoundTrip implements Validator{

    validate(control: AbstractControl): any {

        let formGroup = <FormGroup> control;
        let fromCtrl = formGroup.controls['from'];
        let toCtrl = formGroup.controls['to'];

        if (!fromCtrl || !toCtrl) return { };

        let from = fromCtrl.value;
        let to = toCtrl.value;

        if (from == to) {
            return {
                'round-trip': {
                    city: from
                }
            }
        }
        return { };

    }

}