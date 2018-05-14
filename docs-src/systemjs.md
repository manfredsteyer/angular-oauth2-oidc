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

Also thanks to [ppanthony](https://github.com/ppanthony) for sharing his SystemJS config:

```
'angular-oauth2-oidc': {
    main: 'angular-oauth2-oidc.umd.js',
    format: 'cjs',
    defaultExtension: 'js',
    map: {
        'jsrsasign': '/node_modules/jsrsasign/lib/jsrsasign',
    },
    meta: {
        'angular-oauth2-oidc': {
            deps: ['require','jsrsasign']
        },
    }
}
```