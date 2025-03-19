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
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/OAuthModule.html" data-type="entity-link" >OAuthModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AbstractValidationHandler.html" data-type="entity-link" >AbstractValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthConfig.html" data-type="entity-link" >AuthConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/DateTimeProvider.html" data-type="entity-link" >DateTimeProvider</a>
                            </li>
                            <li class="link">
                                <a href="classes/Hash.html" data-type="entity-link" >Hash</a>
                            </li>
                            <li class="link">
                                <a href="classes/HashHandler.html" data-type="entity-link" >HashHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/HMAC.html" data-type="entity-link" >HMAC</a>
                            </li>
                            <li class="link">
                                <a href="classes/JwksValidationHandler.html" data-type="entity-link" >JwksValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginOptions.html" data-type="entity-link" >LoginOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/NullValidationHandler.html" data-type="entity-link" >NullValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthErrorEvent.html" data-type="entity-link" >OAuthErrorEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthEvent.html" data-type="entity-link" >OAuthEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthInfoEvent.html" data-type="entity-link" >OAuthInfoEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthLogger.html" data-type="entity-link" >OAuthLogger</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthModuleConfig.html" data-type="entity-link" >OAuthModuleConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthNoopResourceServerErrorHandler.html" data-type="entity-link" >OAuthNoopResourceServerErrorHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthResourceServerConfig.html" data-type="entity-link" >OAuthResourceServerConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthResourceServerErrorHandler.html" data-type="entity-link" >OAuthResourceServerErrorHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthStorage.html" data-type="entity-link" >OAuthStorage</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthSuccessEvent.html" data-type="entity-link" >OAuthSuccessEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReceivedTokens.html" data-type="entity-link" >ReceivedTokens</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationHandler.html" data-type="entity-link" >ValidationHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebHttpUrlEncodingCodec.html" data-type="entity-link" >WebHttpUrlEncodingCodec</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/DefaultHashHandler.html" data-type="entity-link" >DefaultHashHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MemoryStorage.html" data-type="entity-link" >MemoryStorage</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OAuthService.html" data-type="entity-link" >OAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemDateTimeProvider.html" data-type="entity-link" >SystemDateTimeProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UrlHelperService.html" data-type="entity-link" >UrlHelperService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interceptors-links"' :
                            'data-bs-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/DefaultOAuthInterceptor.html" data-type="entity-link" class="deprecated-name">DefaultOAuthInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/OidcDiscoveryDoc.html" data-type="entity-link" >OidcDiscoveryDoc</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParsedIdToken.html" data-type="entity-link" >ParsedIdToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TokenResponse.html" data-type="entity-link" >TokenResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInfo.html" data-type="entity-link" >UserInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationParams.html" data-type="entity-link" >ValidationParams</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
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
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});