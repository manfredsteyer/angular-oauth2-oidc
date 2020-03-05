# Manually Skipping the Login Form 

First, try to use the ``loadDiscoveryDocumentAndLogin`` method instead of ``loadDiscoveryDocumentAndTryLogin``. If you need more control, the following could be interesting for you.

```TypeScript
this.oauthService
    .loadDiscoveryDocumentAndTryLogin(/* { your LoginOptions }*/) // checks to see if the current url contains id token and access token
    .(hasReceivedTokens => {
        // this would have stored all the tokens needed
        if (hasReceivedTokens) {
            // carry on with your app
            return Promise.resolve();

            /* if you wish to do something when the user receives tokens from the identity server,
             * use the event stream or the `onTokenReceived` callback in LoginOptions.
             *
             * this.oauthService.events(filter(e => e.type === 'token_received')).subscribe()
             */
        } else {
            // may want to check if you were previously authenticated
            if (this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()) {
                return Promise.resolve();
            } else {
                // to safe guard this from progressing through the calling promise,
                // resolve it when it directed to the sign up page
                return new Promise(resolve => {
                    this.oauthService.initLoginFlow();
                    // example if you are using explicit flow
                    this.window.addEventListener('unload', () => {
                        resolve(true);
                    });
                });
            }
        }
    })
```