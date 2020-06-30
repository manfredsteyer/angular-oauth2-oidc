# Refreshing a Token using Code Flow (not Implicit Flow!)

When using code flow, you can get an ``refresh_token``. While the original standard DOES NOT allow this for SPAs, the mentioned [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13) document proposes to ease this limitation. However, it specifies a list of requirements one should take care about before using ``refresh_tokens``. Please make sure you respect those requirements.

Please also note, that you have to request the ``offline_access`` scope to get an refresh token.

To refresh your token, just call the ``refreshToken`` method:

```typescript
this.oauthService.refreshToken();
```


## Automatically refreshing a token when/ before it expires (Code Flow and Implicit Flow)

To automatically refresh a token when/ some time before it expires, just call the following method after configuring the ``OAuthService``:

```TypeScript
this.oauthService.setupAutomaticSilentRefresh();
```

By default, this event is fired after 75% of the token's life time is over. You can adjust this factor by setting the property ``timeoutFactor`` to a value between 0 and 1. For instance, 0.5 means, that the event is fired after half of the life time is over and 0.33 triggers the event after a third.
