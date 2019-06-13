import { Attribute, Directive } from '@angular/core';
import { AbstractControl, FormGroup, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: 'input[appCity]', // <input appCity>
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CityValidatorDirective,
      multi: true
    }
  ]
})
export class CityValidatorDirective implements Validator {
  // @Input() appCity: string;

  constructor(@Attribute('appCity') private appCity: string) {
  }

  validate(c: AbstractControl): any {
    const formGroup = c.root as FormGroup;
    const otherValueCtrl = formGroup.controls.to;

    if (!otherValueCtrl) {
      return {};
    }

    const otherValue = otherValueCtrl.value;

    if (otherValue === c.value) {
      return {
        appCity: 'rundflug'
      };
    }

    if (!this.appCity) {
      return {};
    }

    const allowed = this.appCity.split(','); // ['Graz', 'Hamburg', 'Wien', 'Frankfurt'];

    if (allowed.indexOf(c.value) === -1) {
      return {
        appCity: true
      };
    }

    return {};
  }
}
