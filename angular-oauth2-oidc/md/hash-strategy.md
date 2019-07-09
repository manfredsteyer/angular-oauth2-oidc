# Routing with the HashStrategy

If you are leveraging the ``LocationStrategy`` which the Router is using by default, you can skip this section.

When using the ``HashStrategy`` for Routing, the Router will override the received hash fragment with the tokens when it performs it initial navigation. This prevents the library from reading them. To avoid this, disable initial navigation when setting up the routes for your root module:

```TypeScript
export let AppRouterModule = RouterModule.forRoot(APP_ROUTES, {
    useHash: true,
    initialNavigation: false
});
```

After tryLogin did its job, you can manually perform the initial navigation:

```TypeScript
this.oauthService.tryLogin().then(_ => {
    this.router.navigate(['/']);
})
```

Another solution is the use a redirect uri that already contains the initial route. In this case the router will not override it. An example for such a redirect uri is

```
    http://localhost:8080/#/home
```
