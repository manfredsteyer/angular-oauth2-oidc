# Using SystemJS

Thanks to [Kevin BEAUGRAND](https://github.com/kbeaugrand) for adding this information regarding SystemJS.

```TypeScript
System.config({
...
 meta: {
            'angular-oauth2-oidc': {
                deps: ['jsrsasign']
            },
        }
...
});
```