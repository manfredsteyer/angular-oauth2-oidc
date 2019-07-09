# Preserving State (like the Requested URL)

When calling ``initImplicitFlow``, you can pass an optional state which could be the requested url:

```TypeScript
this.oauthService.initImplicitFlow('http://www.myurl.com/x/y/z');
```

After login succeeded, you can read this state:

```TypeScript
this.oauthService.tryLogin({
    onTokenReceived: (info) => {
        console.debug('state', info.state);
    }
})
```
