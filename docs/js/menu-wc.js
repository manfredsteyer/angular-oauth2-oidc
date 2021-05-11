'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">angular-oauth2-oidc</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/getting-started.html" data-type="entity-link" data-context-id="additional">Getting Started</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/preserving-state-(like-the-requested-url).html" data-type="entity-link" data-context-id="additional">Preserving State (like the Requested URL)</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/refreshing-a-token.html" data-type="entity-link" data-context-id="additional">Refreshing a Token</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/silent-refresh.html" data-type="entity-link" data-context-id="additional">Silent Refresh</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/working-with-httpinterceptors.html" data-type="entity-link" data-context-id="additional">Working with HttpInterceptors</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/callback-after-login.html" data-type="entity-link" data-context-id="additional">Callback after login</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/popup-based-login.html" data-type="entity-link" data-context-id="additional">Popup-based Login</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/custom-query-parameters.html" data-type="entity-link" data-context-id="additional">Custom Query Parameters</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/events.html" data-type="entity-link" data-context-id="additional">Events</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/routing-with-the-hashstrategy.html" data-type="entity-link" data-context-id="additional">Routing with the HashStrategy</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/adapt-id_token-validation.html" data-type="entity-link" data-context-id="additional">Adapt id_token Validation</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/session-checks.html" data-type="entity-link" data-context-id="additional">Session Checks</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/server-side-rendering.html" data-type="entity-link" data-context-id="additional">Server Side Rendering</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/configure-library-for-implicit-flow-without-discovery-document.html" data-type="entity-link" data-context-id="additional">Configure Library for Implicit Flow without discovery document</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/using-an-id-provider-that-fails-discovery-document-validation.html" data-type="entity-link" data-context-id="additional">Using an ID Provider that Fails Discovery Document Validation</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/using-systemjs.html" data-type="entity-link" data-context-id="additional">Using SystemJS</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/using-implicit-flow.html" data-type="entity-link" data-context-id="additional">Using Implicit Flow</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/using-password-flow.html" data-type="entity-link" data-context-id="additional">Using Password Flow</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/configure-custom-oauthstorage.html" data-type="entity-link" data-context-id="additional">Configure custom OAuthStorage</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/manually-skipping-login-form.html" data-type="entity-link" data-context-id="additional">Manually Skipping Login Form</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/original-config-api.html" data-type="entity-link" data-context-id="additional">Original Config API</a>
                                    </li>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/authorization-servers.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-64bc69bb1a8182c122d3c7f9e3c63e2d"' : 'data-target="#xs-additional-page-64bc69bb1a8182c122d3c7f9e3c63e2d"' }>
                                                <span class="link-name">Authorization Servers</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-64bc69bb1a8182c122d3c7f9e3c63e2d"' : 'id="xs-additional-page-64bc69bb1a8182c122d3c7f9e3c63e2d"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/authorization-servers/using-identity-server.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Using Identity Server</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/authorization-servers/using-keycloak.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Using Keycloak</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/authorization-servers/auth0.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Auth0</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/OAuthModule.html" data-type="entity-link">OAuthModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AbstractValidationHandler.html" data-type="entity-link">AbstractValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthConfig.html" data-type="entity-link">AuthConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/HashHandler.html" data-type="entity-link">HashHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/JwksValidationHandler.html" data-type="entity-link">JwksValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginOptions.html" data-type="entity-link">LoginOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/NullValidationHandler.html" data-type="entity-link">NullValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthErrorEvent.html" data-type="entity-link">OAuthErrorEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthEvent.html" data-type="entity-link">OAuthEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthInfoEvent.html" data-type="entity-link">OAuthInfoEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthLogger.html" data-type="entity-link">OAuthLogger</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthModuleConfig.html" data-type="entity-link">OAuthModuleConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthNoopResourceServerErrorHandler.html" data-type="entity-link">OAuthNoopResourceServerErrorHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthResourceServerConfig.html" data-type="entity-link">OAuthResourceServerConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthResourceServerErrorHandler.html" data-type="entity-link">OAuthResourceServerErrorHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthStorage.html" data-type="entity-link">OAuthStorage</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthSuccessEvent.html" data-type="entity-link">OAuthSuccessEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReceivedTokens.html" data-type="entity-link">ReceivedTokens</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationHandler.html" data-type="entity-link">ValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebHttpUrlEncodingCodec.html" data-type="entity-link">WebHttpUrlEncodingCodec</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/DefaultHashHandler.html" data-type="entity-link">DefaultHashHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MemoryStorage.html" data-type="entity-link">MemoryStorage</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OAuthService.html" data-type="entity-link">OAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UrlHelperService.html" data-type="entity-link">UrlHelperService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interceptors-links"' :
                            'data-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/DefaultOAuthInterceptor.html" data-type="entity-link">DefaultOAuthInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/OidcDiscoveryDoc.html" data-type="entity-link">OidcDiscoveryDoc</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParsedIdToken.html" data-type="entity-link">ParsedIdToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TokenResponse.html" data-type="entity-link">TokenResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInfo.html" data-type="entity-link">UserInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationParams.html" data-type="entity-link">ValidationParams</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});