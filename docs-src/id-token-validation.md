# Configure/ Adapt id_token Validation

You can hook in an implementation of the interface ``TokenValidator`` to validate the signature of the received id_token and its at_hash property. This packages provides two implementations:

- JwksValidationHandler
- NullValidationHandler

The former one validates the signature against public keys received via the discovery document (property jwks) and the later one skips the validation on client side.

```TypeScript
import { JwksValidationHandler } from 'angular-oauth2-oidc';

[...]

this.oauthService.tokenValidationHandler = new JwksValidationHandler();
```

In cases where no ValidationHandler is defined, you receive a warning on the console. This means that the library wants you to explicitly decide on this.

## Dependency Injection

You can also setup a ValidationHandler by leveraging dependency injection:

```TypeScript
[...]
providers: [
    { provide: ValidationHandler, useClass: JwksValidationHandler },
],
[...]
```