import { Directive } from '@angular/core';
import { AbstractControl, FormGroup, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'form[round-trip]',
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
        'round-trip': {
          appCity: from
        }
      };
    }
    return {};
  }
}
