import { Injectable } from '@angular/core';
import { DateTimeProvider } from 'angular-oauth2-oidc';

// Enabled this provider will make the sample to fail, since the demo IdP is correctly synced to world time.
// This is just a sample of the implementation, if you need it.
@Injectable()
export class CustomDateTimeProvider extends DateTimeProvider {
  now(): number {
    return Date.now() - 10000000;
  }

  new(): Date {
    // Implement your custom date.
    return new Date();
  }
}
