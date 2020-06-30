## 10.0.0 (2020-06-30)

* chore: increase version in package.json ([84d95a7](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/84d95a7))
* chore: make version 9.2 ready ([415e053](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/415e053))
* chore(deps): bump jsrsasign from 8.0.12 to 8.0.19 ([4def1c1](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4def1c1))
* chore(deps): bump websocket-extensions from 0.1.3 to 0.1.4 ([cae715e](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/cae715e))
* chore(release): 9.2.1 ([7a15194](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/7a15194))
* chore(release): 9.2.2 ([40f5ae5](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/40f5ae5))
* chore(release): 9.3.0 ([f42f943](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/f42f943))
* refactor: inline js-sha256 ([ca435c0](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/ca435c0))
* refactor: remove dep on contributer-table ([b486546](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/b486546))
* refactor: use esm for sha-256 ([92ee76d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/92ee76d))
* feat(oauth-service): pass custom url params to logOut ([4607d55](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4607d55))
* feat(oauth-service): revokeTokenAndLogout with cust params ([026dcb3](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/026dcb3))
* 'disableAtHashCheck' by default if responseType is 'id_token' ([169d749](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/169d749))
* #825: ([38c7c3f](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/38c7c3f)), closes [#825](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/825)
* #825: ([fb3afe4](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/fb3afe4)), closes [#825](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/825)
* Fix issue with ambient type in constructor when running Universal with Ivy ([9e95c73](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/9e95c73))
* Fix typo in code-flow.md ([1816e7b](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/1816e7b))
* Replaced document by this.document #773 ([678ff95](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/678ff95)), closes [#773](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/773)
* response_types including 'code' gets a code_challenge ([58a8132](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/58a8132))
* Update code-flow.md ([5c5288c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/5c5288c))
* docs(readme): use our own idsvr ([65c2b95](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/65c2b95))
* fix: loadDiscoveryDocumentAndLogin should pass state into initLoginFlow ([132c624](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/132c624))
* fix(lib): copying LICENSE file to output build ([e89aa6d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e89aa6d))


# [10.0.0](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/9.2.0...10.0.0) (2020-06-30)


### Bug Fixes

* loadDiscoveryDocumentAndLogin should pass state into initLoginFlow ([132c624](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/132c62426cfe07ddaf0eebb85bdf062ee49e4a06))
* **lib:** copying LICENSE file to output build ([e89aa6d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e89aa6d90054dc4ad20f234db2107e82b11a9386))


### Features

* **oauth-service:** pass custom url params to logOut ([4607d55](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4607d55c6bdf608a32a2a029feac9eb37bfb493d))
* **oauth-service:** revokeTokenAndLogout with cust params ([026dcb3](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/026dcb38e4299afbab8faff1d54dba94cadc1aa6))



# [10.0.0](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/v9.3.0...v10.0.0) (2020-06-30)



# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.


### Features

* **automatic silent refresh:** stopAutomaticRefresh stops all timers. ([8ab853b](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8ab853bf38dd162060d7b6cbd18f7b4fd5a84f18))
* **code-flow:** allow using implicit flow by setting useSilentRefresh to true ([93902a5](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/93902a5808bb9b75a41d4bde44c6ab763bcfa9f6))
* **oauth-service:** pass custom url params to logOut ([4607d55](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4607d55c6bdf608a32a2a029feac9eb37bfb493d))
* **oauth-service:** revokeTokenAndLogout with cust params ([026dcb3](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/026dcb38e4299afbab8faff1d54dba94cadc1aa6))
* **sample:** also use new idsvr 4 for implicit flow demo to prevent issues with same site cookies ([58c6354](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/58c63541bc7d83d72c30577da2b68ac2d1dc35b7))
* **session checks:** Session checks work now for code flow too. Pls see Docs for details. ([4bf8901](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4bf89014d8cc5d50ed716500e3f3ad265b4ae2db))
* **token-revocation:** also revoke refresh_token ([429ed2c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/429ed2c5b50c60ac857ff0ffe84c1d7fc995c6dd))
* remove jsrsasign dependancy ([77cb37a](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/77cb37abfd08762a59b221257ed8d5d5b7c795d4))
* Upgrade to angular 8 ([31c6273](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/31c6273b388af7e796a9ad663e346f1e33ff331c))


### Bug Fixes

* loadDiscoveryDocumentAndLogin should pass state into initLoginFlow ([132c624](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/132c62426cfe07ddaf0eebb85bdf062ee49e4a06))
* **lib:** copying LICENSE file to output build ([e89aa6d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e89aa6d90054dc4ad20f234db2107e82b11a9386))
* **revoketokenandlogout:** explicit way to revoke an access token ([c799ead](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/c799eadbfa616d459af8be1a667499834745d78f))
* **sample:** make sense of the guard ([1cae011](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/1cae011532dc91a250368c95120812d2f78f8109))
* [#687](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/687) ([e2599e0](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e2599e071307ae1efe1592c83bb3b7a01642a61d))
* **code flow:** Fixed code flow for IE 11 ([0f03d39](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/0f03d393aac9fe4e26444a73884dd154318d530f))
* **sample:** use hash-based routing ([3f44eca](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/3f44ecae157305c56ae377fcd6d2df8dfde8adf5))
* **session state:** save session_state also when using code flow ([8fa99ff](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8fa99ff721ea2b08f28bc5e9fa3e48a459e2a59a))
* **state:** passing an url with a querystring as the state, e. g. url?x=1 ([71b705c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/71b705cb5105f6dfb49aabc55607745b881c5dc3))
* missing HttpModule dependency ([7eac8ae](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/7eac8ae5cd1fd549f3933c30790f4b802c2c09f0))
* run tokensetup outside ngzone ([07bb62d](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/07bb62d06abb84ef2da010977d07bfd2a3805b16))
* typo ([3d331f2](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/3d331f2166340db43f0aaca42ce8abc4913cd027))

### [9.2.2](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/v9.2.1...v9.2.2) (2020-05-09)

### [9.2.1](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/v9.2.0...v9.2.1) (2020-04-23)

## [9.2.0](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/v9.1.0...v9.2.0) (2020-03-28)


### Features

* **revoketokenandlogout:** explicit way to revoke an access token according to [RFC 7009](https://tools.ietf.org/html/rfc7009) ([c799ead](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/c799eadbfa616d459af8be1a667499834745d78f))

* **token-revocation:** also revoke refresh_token ([429ed2c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/429ed2c5b50c60ac857ff0ffe84c1d7fc995c6dd))


### Bug Fixes

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