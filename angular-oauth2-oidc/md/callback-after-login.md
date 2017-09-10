# Callback after login

There is a callback ``onTokenReceived``, that is called after a successful login. In this case, the lib received the access_token as
well as the id_token, if it was requested. If there is an id_token, the lib validated it.

```TypeScript
this.oauthService.tryLogin({
    onTokenReceived: context => {
        //
        // Output just for purpose of demonstration
        // Don't try this at home ... ;-)
        //
        console.debug("logged in");
        console.debug(context);
    }
});
```
