# [9.1.0](https://github.com/manfredsteyer/angular-oauth2-oidc/compare/9.0.0...9.1.0) (2020-03-23)


### Bug Fixes

* **code flow:** Fixed code flow for IE 11 ([0f03d39](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/0f03d393aac9fe4e26444a73884dd154318d530f))
* **sample:** use hash-based routing ([3f44eca](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/3f44ecae157305c56ae377fcd6d2df8dfde8adf5))
* **session state:** save session_state also when using code flow ([8fa99ff](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8fa99ff721ea2b08f28bc5e9fa3e48a459e2a59a))
* **state:** passing an url with a querystring as the state, e. g. url?x=1 ([71b705c](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/71b705cb5105f6dfb49aabc55607745b881c5dc3))
* [#687](https://github.com/manfredsteyer/angular-oauth2-oidc/issues/687) ([e2599e0](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/e2599e071307ae1efe1592c83bb3b7a01642a61d))


### Features

* **automatic silent refresh:** stopAutomaticRefresh stops all timers. ([8ab853b](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/8ab853bf38dd162060d7b6cbd18f7b4fd5a84f18))
* **code-flow:** allow using implicit flow by setting useSilentRefresh to true ([93902a5](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/93902a5808bb9b75a41d4bde44c6ab763bcfa9f6))
* **sample:** also use new idsvr 4 for implicit flow demo to prevent issues with same site cookies ([58c6354](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/58c63541bc7d83d72c30577da2b68ac2d1dc35b7))
* **session checks:** Session checks work now for code flow too. Pls see Docs for details. ([4bf8901](https://github.com/manfredsteyer/angular-oauth2-oidc/commit/4bf89014d8cc5d50ed716500e3f3ad265b4ae2db))



