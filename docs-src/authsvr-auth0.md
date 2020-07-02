# Using Auth0

To use this lib with Auth0, open your Auth0 account and configure:

- An app 
- An API

Configure the app to use ``refresh token rotation`` and the grant types ``authorization code`` and ``refresh token``. For grant types, see the advanced settings at the end of the settings page.

## Configuration 

Provide a configuration like this:

```typescript
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

    issuer: 'https://dev-g-61sdfs.eu.auth0.com/',

    // Your app's client id:
    clientId: 'opHt1Tkt9E9fVQTZPBVF1tHVhjrxvyVX',
    redirectUri: window.location.origin,

    scope: 'openid profile email offline_access',

    responseType: 'code',

    logoutUrl: 'https://dev-g-61sdfs.eu.auth0.com/v2/logout',

    customQueryParams: {
        // Your API's name
        audience: 'http://www.angular.at/api'
    },
};
```

## Getting, Using, and Refreshing a Token

This should work as shown in the other examples in this documentation and in the readme file.

## Logging out

Auth0's logout endpoint expects the parameters ``client_id and ``returnTo``:

```typescript
this.oauthService.revokeTokenAndLogout({
  client_id: this.oauthService.clientId,
  returnTo: this.oauthService.redirectUri
}, true);
```

The optional 2nd parameter set to ``true`` ignores CORS issues with the logout endpoint.

## Example

Please find a [demo](https://github.com/manfredsteyer/auth0-demo) for using Auth0 with angular-oauth2-oidc [here](https://github.com/manfredsteyer/auth0-demo).