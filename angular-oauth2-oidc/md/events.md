# Events

The library informs you about its tasks and state using events:

```TypeScript
this.oauthService.events.subscribe(e => {
    console.debug('oauth/oidc event', e);
})
```

For a full list of available events see the string based enum in the file ``events.ts``.
