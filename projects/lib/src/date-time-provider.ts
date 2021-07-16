import { Injectable } from '@angular/core';

export abstract class DateTimeProvider {
  abstract now(): number;
  abstract new(): Date;
}

@Injectable()
export class SystemDateTimeProvider extends DateTimeProvider {
  now(): number {
    return Date.now();
  }

  new(): Date {
    return new Date();
  }
}
