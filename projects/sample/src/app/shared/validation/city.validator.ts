import { Directive, Input, Attribute } from '@angular/core';
import {
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  UntypedFormGroup,
} from '@angular/forms';

@Directive({
  selector: 'input[city]', // <input city>
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CityValidatorDirective,
      multi: true,
    },
  ],
  standalone: false,
})
export class CityValidatorDirective implements Validator {
  // @Input() city: string;

  constructor(@Attribute('city') private city: string) {}

  validate(c: AbstractControl): any {
    let formGroup = <UntypedFormGroup>c.root;
    let otherValueCtrl = formGroup.controls['to'];

    if (!otherValueCtrl) return {};

    let otherValue = otherValueCtrl.value;

    if (otherValue == c.value) {
      return {
        city: 'rundflug',
      };
    }

    if (!this.city) return {};

    let allowed = this.city.split(','); //['Graz', 'Hamburg', 'Wien', 'Frankfurt'];

    if (allowed.indexOf(c.value) == -1) {
      return {
        city: true,
      };
    }

    return {};
  }
}
