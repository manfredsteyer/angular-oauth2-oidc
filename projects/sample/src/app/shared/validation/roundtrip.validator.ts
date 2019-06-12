import { Directive } from '@angular/core';
import {
  FormGroup,
  Validator,
  AbstractControl,
  NG_VALIDATORS,
  FormGroupDirective
} from '@angular/forms';

@Directive({
  selector: 'form[round-trip]',
  providers: [{ provide: NG_VALIDATORS, useExisting: RoundTrip, multi: true }]
})
export class RoundTrip implements Validator {
  validate(control: AbstractControl): any {
    const formGroup = control as FormGroup;
    const fromCtrl = formGroup.controls.from;
    const toCtrl = formGroup.controls.to;

    if (!fromCtrl || !toCtrl) { return {}; }

    const from = fromCtrl.value;
    const to = toCtrl.value;

    if (from === to) {
      return {
        'round-trip': {
          city: from
        }
      };
    }
    return {};
  }
}
