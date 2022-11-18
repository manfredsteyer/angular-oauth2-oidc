# angular-oauth2-oidc

Support for OAuth 2 and OpenId Connect (OIDC) in Angular. Already prepared for the upcoming OAuth 2.1.

![OIDC Certified Logo](https://raw.githubusercontent.com/manfredsteyer/angular-oauth2-oidc/master/oidc.png)

## Credits

- [jsrsasign](https://kjur.github.io/jsrsasign/) for validating token signature and for hashing
- [Identity Server](https://github.com/identityserver) for testing with an .NET/.NET Core Backend
- [Keycloak (Redhat)](http://www.keycloak.org/) for testing with Java
- [Auth0](https://auth0.com/)

## Resources

- Sources and Sample: [https://github.com/manfredsteyer/angular-oauth2-oidc](https://github.com/manfredsteyer/angular-oauth2-oidc)
- Source Code Documentation: [https://manfredsteyer.github.io/angular-oauth2-oidc/docs](https://manfredsteyer.github.io/angular-oauth2-oidc/docs)
- Community-provided sample implementation: [https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/](https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/)


## Tested Environment

Successfully tested with **Angular 4.3 to Angular 15** and its Router, PathLocationStrategy as well as HashLocationStrategy and CommonJS-Bundling via webpack. 

At server side we've used **IdentityServer** (.NET / .NET Core), Redhat's **Keycloak** (Java), and **Auth0** (Auth0 is officially supported since version 10 of this lib). For Auth0, please have a look into the respective documentation page here.

For using this library with **Azure Active Directory** (**Azure AD**), we recommend an additional look to this [blog post](https://dev.to/yuriburger/azure-active-directory-b2c-with-pkce-for-your-angular-app-1dcg) and the example linked at the end of this blog post.

Also, the Okta community created some guidelines on how to use this lib with Okta. See the links at the end of this page for more information.

**Angular 15**: Use 15.x versions of this library (**should also work with older Angular versions!**).

**Angular 14**: Use 14.x versions of this library (**should also work with older Angular versions!**).

**Angular 13**: Use 13.x versions of this library (**should also work with older Angular versions!**).

**Angular 12**: Use 12.x versions of this library (**should also work with older Angular versions!**).

**Angular 11**: Use 10.x versions of this library (**should also work with older Angular versions!**).

**Angular 10**: Use 10.x versions of this library (**should also work with older Angular versions!**).

**Angular 9**: Use 9.x versions of this library (**should also work with older Angular versions!**).

**Angular 8**: Use 8.x versions of this library.

**Angular 7**: Use 7.x versions of this library.

**Angular 6**: Use Version 4.x of this library. Version 4.x was tested with Angular 6. You can also try the newer version 5.x of this library which has a much smaller bundle size.

**Angular 5.x or 4.3**: If you need support for Angular < 6 (4.3 to 5.x) you can download the former version 3.1.4 (npm i angular-oauth2-oidc@^3 --save).

## Release Cycle

- We plan one major release for each Angular version
  - Will contain new features
  - Will contain bug fixes and PRs
- Critical bugfixes on demand

## Contributions

- Feel free to file pull requests
- The issues contain some ideas for PRs and enhancements (see labels)
- If you want to contribute to the docs, you can do so in the `docs-src` folder. Make sure you update `summary.json` as well. Then generate the docs with the following commands:

  ```sh
  npm install -g @compodoc/compodoc
  npm run docs
  ```

## Features

- Logging in via Code Flow + PKCE
  - Hence, you are safe for the upcoming OAuth 2.1
- Logging in via Implicit Flow (where a user is redirected to Identity Provider)
- "Logging in" via Password Flow (where a user enters their password into the client)
- Token Refresh for all supported flows
- Automatically refreshing a token when/some time before it expires
- Querying Userinfo Endpoint
- Querying Discovery Document to ease configuration
- Validating claims of the id_token regarding the specs
- Hook for further custom validations
- Single-Sign-Out by redirecting to the auth-server's logout-endpoint
- Tested with all modern browsers and IE
- Token Revocation according to [RFC 7009](https://tools.ietf.org/html/rfc7009#section-2.2)

## Sample-Auth-Server

You can use the OIDC-Sample-Server used in our examples. It assumes, that your Web-App runs on http://localhost:4200

Username/Password:

- max/geheim
- bob/bob
- alice/alice

_clientIds:_

- spa (Code Flow + PKCE)
- implicit (implicit flow)

_redirectUris:_

- localhost:[4200-4202]
- localhost:[4200-4202]/index.html
- localhost:[4200-4202]/silent-refresh.html

## Installing

```sh
npm i angular-oauth2-oidc --save
```


## Option 1: Standalone APIs

If you use Standalone Components introduced with Angular 14, you can use our standalone API (call to ``provideOAuthClient``) in your ``main.ts`` to setup the ``OAuthClient``:

```TypeScript
// main.ts -- Angular 15+ version
import { bootstrapApplication } from '@angular/platform-browser';

import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { provideOAuthClient } from 'angular-oauth2-oidc';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideOAuthClient()
  ]
});
```

As Angular 14 does have Standalone Components but no Standalone API for its ``HttpClient``, you need to go with the traditional ``HttpClientModule`` in this version:

```TypeScript
// main.ts -- Angular 14 version
import { bootstrapApplication } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule),
    provideOAuthClient()
  ]
});
```

The ``provideOAuthClient`` function takes the same parameters as the forRoot function of the OAuthModule that is still in place for the sake of compatibility with existing code bases.

## Option 2: Using NgModules

```TypeScript
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule } from 'angular-oauth2-oidc';
// etc.

@NgModule({
  imports: [
    // etc.
    HttpClientModule,
    OAuthModule.forRoot()
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    // etc.
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
```

# Logging in

Since Version 8, this library supports code flow and [PKCE](https://tools.ietf.org/html/rfc7636) to align with the current draft of the [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13) document. This is also the foundation of the upcoming OAuth 2.1.

To configure your solution for code flow + PKCE you have to set the `responseType` to `code`:

```TypeScript
  import { AuthConfig } from 'angular-oauth2-oidc';

  export const authCodeFlowConfig: AuthConfig = {
    // Url of the Identity Provider
    issuer: 'https://idsvr4.azurewebsites.net',

    // URL of the SPA to redirect the user to after login
    redirectUri: window.location.origin + '/index.html',

    // The SPA's id. The SPA is registerd with this id at the auth-server
    // clientId: 'server.code',
    clientId: 'spa',

    // Just needed if your auth server demands a secret. In general, this
    // is a sign that the auth server is not configured with SPAs in mind
    // and it might not enforce further best practices vital for security
    // such applications.
    // dummyClientSecret: 'secret',

    responseType: 'code',

    // set the scope for the permissions the client should request
    // The first four are defined by OIDC.
    // Important: Request offline_access to get a refresh token
    // The api scope is a usecase specific one
    scope: 'openid profile email offline_access api',

    showDebugInformation: true,
  };
```

After this, you can initialize the code flow using:

```TypeScript
this.oauthService.initCodeFlow();
```

There is also a convenience method `initLoginFlow` which initializes either the code flow or the implicit flow depending on your configuration.

```TypeScript
this.oauthService.initLoginFlow();
```

Also -- as shown in the readme -- you have to execute the following code when bootstrapping to make the library to fetch the token:

```TypeScript
this.oauthService.configure(authCodeFlowConfig);
this.oauthService.loadDiscoveryDocumentAndTryLogin();
```

### Logging out

The logOut method clears the used token store (by default ``sessionStorage``) and forwards the user to the auth servers logout endpoint if one was configured (manually or via the discovery document).

```typescript
this.oauthService.logOut();
```

If you want to revoke the existing access token and the existing refresh token before logging out, use the following method:

```typescript
this.oauthService.revokeTokenAndLogout();
```

### Skipping the Login Form

If you don't want to display a login form that tells the user that they are redirected to the identity server, you can use the convenience function `this.oauthService.loadDiscoveryDocumentAndLogin();` instead of `this.oauthService.loadDiscoveryDocumentAndTryLogin();` when setting up the library.

This directly redirects the user to the identity server if there are no valid tokens. Ensure you have your `issuer` set to your discovery document endpoint!

### Calling a Web API with an Access Token

You can automate this task by switching `sendAccessToken` on and by setting `allowedUrls` to an array with prefixes for the respective URLs. Use lower case for the prefixes.

```TypeScript
OAuthModule.forRoot({
    resourceServer: {
        allowedUrls: ['http://www.angular.at/api'],
        sendAccessToken: true
    }
})
```

If you need more versatility, you can look in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/working-with-httpinterceptors.html) how to setup a custom interceptor.

## Token Refresh

See docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/refreshing-a-token.html

## Routing

If you use the `PathLocationStrategy` (which is on by default) and have a general catch-all-route (`path: '**'`) you should be fine. Otherwise look up the section `Routing with the HashStrategy` in the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/).

## Implicit Flow

Nowadays, using code flow + PKCE -- as shown above -- is the recommended OAuth 2/OIDC flow for SPAs. To use the older implicit flow, lookup this docs: https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/using-implicit-flow.html

## More Documentation (!)

See the [documentation](https://manfredsteyer.github.io/angular-oauth2-oidc/docs/) for more information about this library.


## Breaking Change in Version 9

With regards to tree shaking, beginning with version 9, the `JwksValidationHandler` has been moved to a library of its own. If you need it for implementing **implicit flow**, please install it using npm:

```
npm i angular-oauth2-oidc-jwks --save
```

After that, you can import it into your application by using this:

```typescript
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
```

instead of that:

```typescript
import { JwksValidationHandler } from 'angular-oauth2-oidc';
```

Please note, that this dependency is not needed for the **code flow**, which is nowadays the **recommended** flow for single page applications. This also results in smaller bundle sizes.



### Breaking change in 9.1.0

The use of `encodeURIComponent` on the argument passed to `initImplicitFlow` and its Code Flow counterparts was mandatory before this version.

Since that was considered a _bug_, the need to do so was removed.
Now the reverse is true **if you're upgrading from before 9.0.0**: you need to remove any call to encode URI components in your own application, as the library will now do it for you.

## Tutorials

- [Tutorial with Demo Servers available online](https://www.softwarearchitekt.at/post/2016/07/03/authentication-in-angular-2-with-oauth2-oidc-and-guards-for-the-newest-new-router-english-version.aspx)
- [Angular Authentication with OpenID Connect and Okta in 20 Minutes](https://developer.okta.com/blog/2017/04/17/angular-authentication-with-oidc)
- [Add Authentication to Your Angular PWA](https://developer.okta.com/blog/2017/06/13/add-authentication-angular-pwa)
- [Build an Ionic App with User Authentication](https://developer.okta.com/blog/2017/08/22/build-an-ionic-app-with-user-authentication)
- [On-Site Workshops](https://www.softwarearchitekt.at)
- [Angular 6 with Auth0 using this library](https://github.com/jeroenheijmans/sample-auth0-angular-oauth2-oidc)

## Thanks to all Contributors

[<img alt="alexandis" src="https://avatars.githubusercontent.com/u/6149843?v=4&s=117" width="117">](https://github.com/alexandis)[<img alt="anbiniyar" src="https://avatars.githubusercontent.com/u/407653?v=4&s=117" width="117">](https://github.com/anbiniyar)[<img alt="anoordende" src="https://avatars.githubusercontent.com/u/11973801?v=4&s=117" width="117">](https://github.com/anoordende)[<img alt="ArsProgramma" src="https://avatars.githubusercontent.com/u/4572729?v=4&s=117" width="117">](https://github.com/ArsProgramma)[<img alt="nihanth007" src="https://avatars.githubusercontent.com/u/14851784?v=4&s=117" width="117">](https://github.com/nihanth007)

[<img alt="bobvandevijver" src="https://avatars.githubusercontent.com/u/1835343?v=4&s=117" width="117">](https://github.com/bobvandevijver)[<img alt="BobCui20" src="https://avatars.githubusercontent.com/u/59807069?v=4&s=117" width="117">](https://github.com/BobCui20)[<img alt="Bottswana" src="https://avatars.githubusercontent.com/u/6907460?v=4&s=117" width="117">](https://github.com/Bottswana)[<img alt="ErazerBrecht" src="https://avatars.githubusercontent.com/u/6287467?v=4&s=117" width="117">](https://github.com/ErazerBrecht)[<img alt="Chris3773" src="https://avatars.githubusercontent.com/u/22506071?v=4&s=117" width="117">](https://github.com/Chris3773)

[<img alt="ChristianMurphy" src="https://avatars.githubusercontent.com/u/3107513?v=4&s=117" width="117">](https://github.com/ChristianMurphy)[<img alt="d-moos" src="https://avatars.githubusercontent.com/u/14070689?v=4&s=117" width="117">](https://github.com/d-moos)[<img alt="enterprisebug" src="https://avatars.githubusercontent.com/u/1539741?v=4&s=117" width="117">](https://github.com/enterprisebug)[<img alt="craniodev" src="https://avatars.githubusercontent.com/u/8593824?v=4&s=117" width="117">](https://github.com/craniodev)[<img alt="FabianGosebrink" src="https://avatars.githubusercontent.com/u/11268349?v=4&s=117" width="117">](https://github.com/FabianGosebrink)

[<img alt="FabienDehopre" src="https://avatars.githubusercontent.com/u/97023?v=4&s=117" width="117">](https://github.com/FabienDehopre)[<img alt="FRosner" src="https://avatars.githubusercontent.com/u/3427394?v=4&s=117" width="117">](https://github.com/FRosner)[<img alt="MisterJames" src="https://avatars.githubusercontent.com/u/1197383?v=4&s=117" width="117">](https://github.com/MisterJames)[<img alt="JessePreiner" src="https://avatars.githubusercontent.com/u/3847360?v=4&s=117" width="117">](https://github.com/JessePreiner)[<img alt="jesusbotella" src="https://avatars.githubusercontent.com/u/4319728?v=4&s=117" width="117">](https://github.com/jesusbotella)

[<img alt="Jojofoulk" src="https://avatars.githubusercontent.com/u/44689065?v=4&s=117" width="117">](https://github.com/Jojofoulk)[<img alt="kristofdegrave" src="https://avatars.githubusercontent.com/u/1322395?v=4&s=117" width="117">](https://github.com/kristofdegrave)[<img alt="saxicek" src="https://avatars.githubusercontent.com/u/1708442?v=4&s=117" width="117">](https://github.com/saxicek)[<img alt="lukasmatta" src="https://avatars.githubusercontent.com/u/4323927?v=4&s=117" width="117">](https://github.com/lukasmatta)[<img alt="Maximaximum" src="https://avatars.githubusercontent.com/u/5593500?v=4&s=117" width="117">](https://github.com/Maximaximum)

[<img alt="mpbalmeida" src="https://avatars.githubusercontent.com/u/516102?v=4&s=117" width="117">](https://github.com/mpbalmeida)[<img alt="mhyfritz" src="https://avatars.githubusercontent.com/u/718983?v=4&s=117" width="117">](https://github.com/mhyfritz)[<img alt="mdaehnert" src="https://avatars.githubusercontent.com/u/1017301?v=4&s=117" width="117">](https://github.com/mdaehnert)[<img alt="mcserra" src="https://avatars.githubusercontent.com/u/16702410?v=4&s=117" width="117">](https://github.com/mcserra)[<img alt="nhumblot" src="https://avatars.githubusercontent.com/u/15015617?v=4&s=117" width="117">](https://github.com/nhumblot)

[<img alt="l1b3r" src="https://avatars.githubusercontent.com/u/6207227?v=4&s=117" width="117">](https://github.com/l1b3r)[<img alt="oleersoy" src="https://avatars.githubusercontent.com/u/1163873?v=4&s=117" width="117">](https://github.com/oleersoy)[<img alt="OskarsPakers" src="https://avatars.githubusercontent.com/u/3343347?v=4&s=117" width="117">](https://github.com/OskarsPakers)[<img alt="hellerbarde" src="https://avatars.githubusercontent.com/u/37417?v=4&s=117" width="117">](https://github.com/hellerbarde)[<img alt="paweldyminski" src="https://avatars.githubusercontent.com/u/33632375?v=4&s=117" width="117">](https://github.com/paweldyminski)

[<img alt="bechhansen" src="https://avatars.githubusercontent.com/u/426810?v=4&s=117" width="117">](https://github.com/bechhansen)[<img alt="peterneave" src="https://avatars.githubusercontent.com/u/7982708?v=4&s=117" width="117">](https://github.com/peterneave)[<img alt="pmccloghrylaing" src="https://avatars.githubusercontent.com/u/2329335?v=4&s=117" width="117">](https://github.com/pmccloghrylaing)[<img alt="akehir" src="https://avatars.githubusercontent.com/u/1078202?v=4&s=117" width="117">](https://github.com/akehir)[<img alt="RubenVermeulen" src="https://avatars.githubusercontent.com/u/10133445?v=4&s=117" width="117">](https://github.com/RubenVermeulen)

[<img alt="ryanmwright" src="https://avatars.githubusercontent.com/u/5000122?v=4&s=117" width="117">](https://github.com/ryanmwright)[<img alt="scttcper" src="https://avatars.githubusercontent.com/u/1400464?v=4&s=117" width="117">](https://github.com/scttcper)[<img alt="abshoff" src="https://avatars.githubusercontent.com/u/2471284?v=4&s=117" width="117">](https://github.com/abshoff)[<img alt="SpazzMarticus" src="https://avatars.githubusercontent.com/u/5716457?v=4&s=117" width="117">](https://github.com/SpazzMarticus)[<img alt="srenatus" src="https://avatars.githubusercontent.com/u/870638?v=4&s=117" width="117">](https://github.com/srenatus)

[<img alt="sven-codeculture" src="https://avatars.githubusercontent.com/u/3930643?v=4&s=117" width="117">](https://github.com/sven-codeculture)[<img alt="Rocket18" src="https://avatars.githubusercontent.com/u/11396142?v=4&s=117" width="117">](https://github.com/Rocket18)[<img alt="Ceteareth" src="https://avatars.githubusercontent.com/u/1556143?v=4&s=117" width="117">](https://github.com/Ceteareth)[<img alt="vadjs" src="https://avatars.githubusercontent.com/u/10026333?v=4&s=117" width="117">](https://github.com/vadjs)[<img alt="Varada-Schneider" src="https://avatars.githubusercontent.com/u/62388762?v=4&s=117" width="117">](https://github.com/Varada-Schneider)

[<img alt="Gimly" src="https://avatars.githubusercontent.com/u/168669?v=4&s=117" width="117">](https://github.com/Gimly)[<img alt="akkaradej" src="https://avatars.githubusercontent.com/u/2855965?v=4&s=117" width="117">](https://github.com/akkaradej)[<img alt="coyoteecd" src="https://avatars.githubusercontent.com/u/47973420?v=4&s=117" width="117">](https://github.com/coyoteecd)[<img alt="darbio" src="https://avatars.githubusercontent.com/u/517620?v=4&s=117" width="117">](https://github.com/darbio)[<img alt="filipvh" src="https://avatars.githubusercontent.com/u/6095002?v=4&s=117" width="117">](https://github.com/filipvh)

[<img alt="kyubisation" src="https://avatars.githubusercontent.com/u/594745?v=4&s=117" width="117">](https://github.com/kyubisation)[<img alt="luciimon" src="https://avatars.githubusercontent.com/u/9714755?v=4&s=117" width="117">](https://github.com/luciimon)[<img alt="mike-rivera" src="https://avatars.githubusercontent.com/u/57490323?v=4&s=117" width="117">](https://github.com/mike-rivera)[<img alt="drobert-bfm" src="https://avatars.githubusercontent.com/u/28102639?v=4&s=117" width="117">](https://github.com/drobert-bfm)[<img alt="roblabat" src="https://avatars.githubusercontent.com/u/9885738?v=4&s=117" width="117">](https://github.com/roblabat)

[<img alt="wdunn001" src="https://avatars.githubusercontent.com/u/4011100?v=4&s=117" width="117">](https://github.com/wdunn001)[<img alt="adrianbenjuya" src="https://avatars.githubusercontent.com/u/17908930?v=4&s=117" width="117">](https://github.com/adrianbenjuya)[<img alt="Andreas-Hjortland" src="https://avatars.githubusercontent.com/u/2162904?v=4&s=117" width="117">](https://github.com/Andreas-Hjortland)[<img alt="adematte" src="https://avatars.githubusercontent.com/u/5064637?v=4&s=117" width="117">](https://github.com/adematte)[<img alt="cgatian" src="https://avatars.githubusercontent.com/u/1752170?v=4&s=117" width="117">](https://github.com/cgatian)

[<img alt="dirkbolte" src="https://avatars.githubusercontent.com/u/1572945?v=4&s=117" width="117">](https://github.com/dirkbolte)[<img alt="enricodeleo" src="https://avatars.githubusercontent.com/u/3534555?v=4&s=117" width="117">](https://github.com/enricodeleo)[<img alt="Gregordy" src="https://avatars.githubusercontent.com/u/10693717?v=4&s=117" width="117">](https://github.com/Gregordy)[<img alt="jeroenhinfi" src="https://avatars.githubusercontent.com/u/38323074?v=4&s=117" width="117">](https://github.com/jeroenhinfi)[<img alt="linjie997" src="https://avatars.githubusercontent.com/u/23615368?v=4&s=117" width="117">](https://github.com/linjie997)

[<img alt="jfyne" src="https://avatars.githubusercontent.com/u/400281?v=4&s=117" width="117">](https://github.com/jfyne)[<img alt="kevincathcart-cas" src="https://avatars.githubusercontent.com/u/72209838?v=4&s=117" width="117">](https://github.com/kevincathcart-cas)[<img alt="martin1cerny" src="https://avatars.githubusercontent.com/u/773078?v=4&s=117" width="117">](https://github.com/martin1cerny)[<img alt="marvinosswald" src="https://avatars.githubusercontent.com/u/1621844?v=4&s=117" width="117">](https://github.com/marvinosswald)[<img alt="nick1699" src="https://avatars.githubusercontent.com/u/50705000?v=4&s=117" width="117">](https://github.com/nick1699)

[<img alt="paulyoder" src="https://avatars.githubusercontent.com/u/224111?v=4&s=117" width="117">](https://github.com/paulyoder)[<img alt="reda-alaoui" src="https://avatars.githubusercontent.com/u/2890843?v=4&s=117" width="117">](https://github.com/reda-alaoui)[<img alt="remiburtin" src="https://avatars.githubusercontent.com/u/4236675?v=4&s=117" width="117">](https://github.com/remiburtin)[<img alt="gingters" src="https://avatars.githubusercontent.com/u/755148?v=4&s=117" width="117">](https://github.com/gingters)[<img alt="kranich" src="https://avatars.githubusercontent.com/u/7249754?v=4&s=117" width="117">](https://github.com/kranich)

[<img alt="StefanoChiodino" src="https://avatars.githubusercontent.com/u/1428893?v=4&s=117" width="117">](https://github.com/StefanoChiodino)[<img alt="tpeter1985" src="https://avatars.githubusercontent.com/u/16336536?v=4&s=117" width="117">](https://github.com/tpeter1985)[<img alt="dennisameling" src="https://avatars.githubusercontent.com/u/17739158?v=4&s=117" width="117">](https://github.com/dennisameling)[<img alt="dependabot[bot]" src="https://avatars.githubusercontent.com/in/29110?v=4&s=117" width="117">](https://github.com/apps/dependabot)[<img alt="jdgeier" src="https://avatars.githubusercontent.com/u/949299?v=4&s=117" width="117">](https://github.com/jdgeier)

[<img alt="mraible" src="https://avatars.githubusercontent.com/u/17892?v=4&s=117" width="117">](https://github.com/mraible)[<img alt="ajpierson" src="https://avatars.githubusercontent.com/u/56389?v=4&s=117" width="117">](https://github.com/ajpierson)[<img alt="artnim" src="https://avatars.githubusercontent.com/u/414375?v=4&s=117" width="117">](https://github.com/artnim)[<img alt="fmalcher" src="https://avatars.githubusercontent.com/u/1683147?v=4&s=117" width="117">](https://github.com/fmalcher)[<img alt="Flofie" src="https://avatars.githubusercontent.com/u/12624982?v=4&s=117" width="117">](https://github.com/Flofie)

[<img alt="mabdelaal86" src="https://avatars.githubusercontent.com/u/11019219?v=4&s=117" width="117">](https://github.com/mabdelaal86)[<img alt="nhance" src="https://avatars.githubusercontent.com/u/602226?v=4&s=117" width="117">](https://github.com/nhance)[<img alt="Razzeee" src="https://avatars.githubusercontent.com/u/5943908?v=4&s=117" width="117">](https://github.com/Razzeee)[<img alt="maxisam" src="https://avatars.githubusercontent.com/u/456807?v=4&s=117" width="117">](https://github.com/maxisam)[<img alt="ismcagdas" src="https://avatars.githubusercontent.com/u/4133525?v=4&s=117" width="117">](https://github.com/ismcagdas)

[<img alt="Toxicable" src="https://avatars.githubusercontent.com/u/13490925?v=4&s=117" width="117">](https://github.com/Toxicable)[<img alt="ManuelRauber" src="https://avatars.githubusercontent.com/u/740791?v=4&s=117" width="117">](https://github.com/ManuelRauber)[<img alt="vdveer" src="https://avatars.githubusercontent.com/u/1217814?v=4&s=117" width="117">](https://github.com/vdveer)[<img alt="jeroenheijmans" src="https://avatars.githubusercontent.com/u/1590536?v=4&s=117" width="117">](https://github.com/jeroenheijmans)[<img alt="manfredsteyer" src="https://avatars.githubusercontent.com/u/1573728?v=4&s=117" width="117">](https://github.com/manfredsteyer)


