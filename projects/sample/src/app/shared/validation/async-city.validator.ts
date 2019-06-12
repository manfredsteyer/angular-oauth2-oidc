import { Directive } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS } from '@angular/forms';

@Directive({
  selector: 'input[async-city]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: AsyncCityValidatorDirective,
      multi: true
    }
  ]
})
export class AsyncCityValidatorDirective {
  validate(ctrl: AbstractControl): Promise<any> {
    return new Promise((resolve: Function) => {
      setTimeout(() => {
        if (ctrl.value === 'Graz' || ctrl.value === 'Hamburg') {
          resolve({});
          return;
        }

        resolve({'async-city': false});
      }, 100);
    });
  }
}
