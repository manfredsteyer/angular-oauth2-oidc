import { AuthConfig } from 'angular-oauth2-oidc';


export function AuthConfigFactory(idp_url: string, clientId: string): AuthConfig {
    return {
        // Url of the Identity Provider
        issuer: idp_url,

        // URL of the SPA to redirect the user to after login
        redirectUri: window.location.origin,

        // The SPA's id. The SPA is registerd with this id at the auth-server
        // clientId: 'server.code',


        clientId: clientId,

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
        scope: 'openid profile offline_access role coreAPI rahavardAPI',

        showDebugInformation: true,

        // Not recommented:
        // disablePKCI: true,
    }
};
