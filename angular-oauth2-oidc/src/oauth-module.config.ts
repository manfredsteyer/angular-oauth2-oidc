

export abstract class OAuthModuleConfig {
    resourceServer: OAuthResourceServerConfig;
}

export abstract class OAuthResourceServerConfig {

    /**
     * Urls for which calls should be intercepted.
     * If there is an ResourceServerErrorHandler registered, it is used for them.
     * If sendAccessToken is set to true, the access_token is send to them too.
     */
    allowedUrls: Array<string>;
    sendAccessToken: boolean;
}
