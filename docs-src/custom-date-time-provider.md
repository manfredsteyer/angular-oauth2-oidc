# Custom DateTimeProvider

If your Identity Provider's clock is not synchronized, the validation of the token could fail.
If the deviation is only some seconds, you can use the `AuthConfig.clockSkewInSec` setting to allow a bigger time window deviation.

However, you may need to adjust the base time, that is used for the token validation and make sure, that the `AuthConfig.clockSkewInSec` is still a small reasonable number, then you can implement a custom `DateTimeProvider`.

To do so, create a new service that derives from `DateTimeProvider`:

```typescript
export class MyCustomDateTimeProvider extends DateTimeProvider {
  now(): number {
    // Return your custom now.
    return Date.now();
  }
  
  new(): Date {
    // Return your custom new Date().
    return new Date();
  }
}
```

Then, override the provider via dependency injection in your application:

```typescript
@NgModule({
  imports: [
    // etc.
    OAuthModule.forRoot()
  ],
  providers: [
    { provide: DateTimeProvider, useClass: MyCustomDateTimeProvider } // <- add this
  ],
  declarations: [
    AppComponent,
    // etc.
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
```
