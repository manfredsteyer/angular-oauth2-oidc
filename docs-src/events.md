# Events

The library informs you about its tasks and state using [events](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/injectables/OAuthService.html#events).
This is an `Observable<OAuthEvent>` which publishes a stream of events as they occur in the service.
You can log these events to the console for debugging information.

A short snippet you could use:

```TypeScript
this.oauthService.events.subscribe(e => console.log(e));
```

Or a longer, more extensive version that logs them at different levels:

```TypeScript
import { OAuthErrorEvent } from 'angular-oauth2-oidc';

// ...

this.authService.events.subscribe(event => {
  if (event instanceof OAuthErrorEvent) {
    console.error(event);
  } else {
    console.warn(event);
  }
});
```

Here's a list of the main events you might encounter:

- `discovery_document_loaded` is published whenever the service has retrieved the openid configuration and successfully saved the `jwks` information
- `invalid_nonce_in_state` is published during `tryLogin`, when an access token has been requested and the state check was not disabled via the options, only in case the nonce is not as expected (see OAuth2 spec for more details about the nonce)
- `user_profile_loaded` is published just before `loadUserProfile()` successfully resolves
- `token_received` is published whenever the requested token(s) have been successfully received and stored
- `silently_refreshed` is published when the silent refresh timer has gone off and the library has also successfully refreshed the tokens (only applicable to Implicit Flow)
- `silent_refresh_timeout` is published if the silent refresh timer has gone off but it takes too long to successfully refresh
- `session_error` will only be published if the session checks encounter an error

For a full list of available events see the string based enum in [the file `events.ts`](https://github.com/manfredsteyer/angular-oauth2-oidc/blob/master/projects/lib/src/events.ts).
