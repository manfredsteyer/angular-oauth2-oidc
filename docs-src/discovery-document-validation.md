# Discovery Document Validation

The configuration parameter `strictDiscoveryDocumentValidation` is set `true` by default. This ensures that all of the endpoints provided via the ID Provider discovery document share the same base URL as the `issuer` parameter.

Several ID Providers (i.e. Google OpenID, WS02-IS, PingOne) provide different domains or path params for various endpoints in the discovery document. These providers may still adhere to the [OpenID Connect Provider Configuration specification](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse), but will fail to pass this library's discovery document validation.

To use this library with an ID Provider that does not maintain a consistent base URL across the discovery document endpoints, set the `strictDiscoveryDocumentValidation` parameter to `false` in your configuration:

```TypeScript
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url of the Identity Provider
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/index.html',

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: 'spa-demo',

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email voucher',

  // turn off validation that discovery document endpoints start with the issuer url defined above
  strictDiscoveryDocumentValidation: false
}
```