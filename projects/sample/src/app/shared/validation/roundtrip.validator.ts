import { Directive } from '@angular/core';
import { AbstractControl, FormGroup, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: 'form[appRoundTrip]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: RoundTripDirective,
      multi: true
    }
  ]
})
export class RoundTripDirective implements Validator {
  validate(control: AbstractControl): any {
    const formGroup = control as FormGroup;
    const fromCtrl = formGroup.controls.from;
    const toCtrl = formGroup.controls.to;

    if (!fromCtrl || !toCtrl) {
      return {};
    }

    const from = fromCtrl.value;
    const to = toCtrl.value;

    if (from === to) {
      return {
        appRoundTrip: {
          appCity: from
        }
      };
    }
    return {};
  }
}
