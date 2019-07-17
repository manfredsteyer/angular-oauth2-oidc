# Change Log

## Lates features

See [Release Notes](https://github.com/manfredsteyer/angular-oauth2-oidc/releases)

## New Features in Version 2.1
- New Config API (the original one is still supported)
- New convenience methods in OAuthService to streamline default tasks:
    - ``setupAutomaticSilentRefresh()``
    - ``loadDiscoveryDocumentAndTryLogin()``
- Single Sign out through Session Status Change Notification according to the OpenID Connect Session Management specs. This means, you can be notified when the user logs out using at the login provider.
- Possibility to define the ValidationHandler, the Config as well as the OAuthStorage via DI
- Better structured documentation

## New Features in Version 2
- Token Refresh for Implicit Flow by implementing "silent refresh"
- Validating the signature of the received id_token
- Providing Events via the observable ``events``.
- The event ``token_expires`` can be used together with a silent refresh to automatically refresh a token when/ before it expires (see also property ``timeoutFactor``).

## Breaking Changes in Version 2
- The property ``oidc`` defaults to ``true``.
- If you are just using oauth2, you have to set ``oidc`` to ``false``. Otherwise, the validation of the user profile will fail!
- By default, ``sessionStorage`` is used. To use ``localStorage`` call method setStorage
- Demands using https as OIDC and OAuth2 relay on it. This rule can be relaxed using the property ``requireHttps``, e. g. for local testing.
- Demands that every url provided by the discovery document starts with the issuer's url. This can be relaxed by using the property ``strictDiscoveryDocumentValidation``.
