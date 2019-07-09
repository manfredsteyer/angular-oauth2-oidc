# Custom Query Parameters

You can set the property ``customQueryParams`` to a hash with custom parameter that are transmitted when starting implicit flow.

```TypeScript
this.oauthService.customQueryParams = {
    'tenant': '4711',
    'otherParam': 'someValue'
};
```
