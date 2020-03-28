# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [9.2.0](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/v9.1.0...v9.2.0) (2020-03-28)


### Features

* **token-revocation:** also revoke refresh_token ([429ed2c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/429ed2c5b50c60ac857ff0ffe84c1d7fc995c6dd))


### Bug Fixes

* **revoketokenandlogout:** explicit way to revoke an access token ([c799ead](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/c799eadbfa616d459af8be1a667499834745d78f))
* **sample:** make sense of the guard ([1cae011](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/1cae011532dc91a250368c95120812d2f78f8109))

## 9.1.0 (2020-03-23)


### Features

* **automatic silent refresh:** stopAutomaticRefresh stops all timers. ([8ab853b](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8ab853bf38dd162060d7b6cbd18f7b4fd5a84f18))
* **code-flow:** allow using silent refresh by setting useSilentRefresh to true ([93902a5](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/93902a5808bb9b75a41d4bde44c6ab763bcfa9f6))
* **sample:** Also use new Identity Server 4 for implicit flow demo to prevent issues with same site cookies ([58c6354](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/58c63541bc7d83d72c30577da2b68ac2d1dc35b7))
* **session checks:** Session checks work now for code flow too. Please see docs for details. ([4bf8901](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4bf89014d8cc5d50ed716500e3f3ad265b4ae2db))


### Bug Fixes

* **code flow:** Fixed code flow for IE 11 ([0f03d39](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/0f03d393aac9fe4e26444a73884dd154318d530f))
* **sample:** use hash-based routing ([3f44eca](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/3f44ecae157305c56ae377fcd6d2df8dfde8adf5))
* **session state:** save session_state also when using code flow ([8fa99ff](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8fa99ff721ea2b08f28bc5e9fa3e48a459e2a59a))
* **state:** passing an url with a querystring as the state, e. g. url?x=1 ([71b705c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/71b705cb5105f6dfb49aabc55607745b881c5dc3))
* [#687](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/687) ([e2599e0](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e2599e071307ae1efe1592c83bb3b7a01642a61d))
* missing HttpModule dependency ([7eac8ae](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/7eac8ae5cd1fd549f3933c30790f4b802c2c09f0))
* run tokensetup outside ngzone ([07bb62d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/07bb62d06abb84ef2da010977d07bfd2a3805b16))
* typo ([3d331f2](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/3d331f2166340db43f0aaca42ce8abc4913cd027))

### Pull Requests
- Update sample app and silent-refresh.html script #755, linjie997
- Add optional state parameter for logout, pmccloghrylaing
- fix customHashFragment usage in tryLoginCodeFlow, roblabat
- replace document with injectionToken #741, d-moos
- Support predefined custom parameters extraction from the TokenResponse, vdveer
- Fixed not working silent refresh when using 'code' #735, ErazerBrecht

### Thanks

Big Thanks to all contributers: Brecht Carlier, Daniel Moos, Jie Lin, Manfred Steyer, Phil McCloghry-Laing, robin labat, vdveer

Also, big thanks to jeroenheijmans for doing an awesome job with moderating and analyzing the issues!