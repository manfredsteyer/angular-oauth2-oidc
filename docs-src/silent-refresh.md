## Refreshing when using Implicit Flow (Implicit Flow and Code Flow)

**Notes for Code Flow**: You can also use this strategy for refreshing tokens when using code flow. However, please note, the strategy described within [Token Refresh](./token-refresh.md) is far easier in this case.

To refresh your tokens when using implicit flow you can use a silent refresh. This is a well-known solution that compensates the fact that implicit flow does not allow for issuing a refresh token. It uses a hidden iframe to get another token from the auth server. When the user is there still logged in (by using a cookie) it will respond without user interaction and provide new tokens.

To use this approach, setup a redirect uri for the silent refresh.

For this, you can set the property silentRefreshRedirectUri in the config object:

```TypeScript
// This api will come in the next version

import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url of the Identity Provider
  issuer: 'https://steyer-identity-server.azurewebsites.net/identity',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin + '/index.html',

  // URL of the SPA to redirect the user after silent refresh
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',

  // defaults to true for implicit flow and false for code flow
  // as for code code the default is using a refresh_token
  // Also see docs section 'Token Refresh'
  useSilentRefresh: true,

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: 'spa-demo',

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email voucher',
}
```

As an alternative, you can set the same property directly with the OAuthService:

```TypeScript
this.oauthService.silentRefreshRedirectUri = window.location.origin + "/silent-refresh.html";
```

Please keep in mind that this uri has to be configured at the auth-server too.

This file is loaded into the hidden iframe after getting new tokens. Its only task is to send the received tokens to the main application:

```HTML
<html>
<body>
    <script>
        (window.opener || window.parent).postMessage(location.hash || ('#' + location.search), location.origin);
    </script>
</body>
</html>
```

This simple implementation within silent-refresh.html is sufficient in most cases. It takes care of the hash fragment as well as of the query string (property search). For **edge cases** you need to check if the received hash fragment is a token response. For this, please go with the following **more advanced implementation**:

```html
<html>
    <body>
        <script>
            var checks = [/[\?|&|#]code=/, /[\?|&|#]error=/, /[\?|&|#]token=/, /[\?|&|#]id_token=/];

            function isResponse(str) {
                if (!str) return false;
                for(var i=0; i<checks.length; i++) {
                    if (str.match(checks[i])) return true;
                }
                return false;
            }

            var message = isResponse(location.hash) ? location.hash : '#' + location.search;

            if (window.parent && window.parent !== window) {
                // if loaded as an iframe during silent refresh
                window.parent.postMessage(message, location.origin);
            } else if (window.opener && window.opener !== window) {
                // if loaded as a popup during initial login
                window.opener.postMessage(message, location.origin);
            } else {
                // last resort for a popup which has been through redirects and can't use window.opener
                localStorage.setItem('auth_hash', message);
                localStorage.removeItem('auth_hash');
            }
        </script>
    </body>
</html>
```
The above example checks if the message in the URL (either hash or query string) is indeed a message returned with a response from an authentication provider and not an arbitrary value and then attempts to forward this message to a parent widow either by `.parent` (when this html is loaded in an iframe as a result of silent refresh) or by `.opener` (when the html is loaded into a popup during initial login) or finally using a storage event (as a fallback for complex cases, e.g. initial login in a popup with a cross-domain auth provider).

 
Please make sure that this file is copied to your output directory by your build task. When using the CLI you can define it as an asset for this. For this, you have to add the following line to the file ``.angular-cli.json``:

```JSON
"assets": [
    [...],
    "silent-refresh.html"
],
```

To perform a silent refresh, just call the following method:

```TypeScript
this
    .oauthService
    .silentRefresh()
    .then(info => console.debug('refresh ok', info))
    .catch(err => console.error('refresh error', err));
```

When there is an error in the iframe that prevents the communication with the main application, silentRefresh will give you a timeout. To configure the timespan for this, you can set the property ``silentRefreshTimeout`` (msec). The default value is 20.000 (20 seconds).

### Automatically refreshing a token when/ before it expires (Code Flow and Implicit Flow)


To automatically refresh a token when/ some time before it expires, just call the following method after configuring the OAuthService:

```TypeScript
this.oauthService.setupAutomaticSilentRefresh();
```

By default, this event is fired after 75% of the token's life time is over. You can adjust this factor by setting the property ``timeoutFactor`` to a value between 0 and 1. For instance, 0.5 means, that the event is fired after half of the life time is over and 0.33 triggers the event after a third.
