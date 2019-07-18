import { AuthConfig } from 'angular-oauth2-oidc';

export const noDiscoveryAuthConfig: AuthConfig = {
  clientId:
    '1004270452653-m396kcs7jc3970turlp7ffh6bv4t1b86.apps.googleusercontent.com',
  redirectUri: 'http://localhost:4200/index.html',
  postLogoutRedirectUri: '',
  loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scope: 'openid profile email',
  resource: '',
  rngUrl: '',
  oidc: true,
  requestAccessToken: true,
  options: null,
  issuer: 'https://accounts.google.com',
  clearHashAfterLogin: true,
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  userinfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
  responseType: 'token',
  showDebugInformation: true,
  silentRefreshRedirectUri: 'http://localhost:4200/silent-refresh.html',
  silentRefreshMessagePrefix: '',
  silentRefreshShowIFrame: false,
  silentRefreshTimeout: 20000,
  dummyClientSecret: null,
  requireHttps: 'remoteOnly',
  strictDiscoveryDocumentValidation: false,
  jwks: {
    keys: [
      {
        kty: 'RSA',
        alg: 'RS256',
        use: 'sig',
        kid: '7540561fdb04b89d824a1b7b9e8849873e7cb50e',
        n:
          // tslint:disable-next-line: max-line-length
          'sSFZrLIrXzvXBCehdPR10T-mfHWFU5ZtGzW9buI7wT_tJzZ1SRUc2l1NH92kGV9bmWRtDLjWcWFwMG7rbjX25-R-62lD1k15gQiO4bhx7gbV05e36os2vXTs0ypj9GS9y8X_2fYAnxxulMLwz4m24Ejo2tQI43-V-3Tec6cSXe0FjhRaPbGdS8GHPDKkhpJ1NHMZ38vhddIImOfvtVuz3lt_zwjBsAC6Q7PHs2GOm3KtC22DCwXMYSri4QOQcasuvTlZxIQSIksTyuH0T02IH5SJvQZSx46Vfq8BM4JP-zEEjzadoyxQPouRM6TrUeaqNv5B1f1lbH6G0G_r_ddYWQ',
        e: 'AQAB'
      },
      {
        kty: 'RSA',
        alg: 'RS256',
        use: 'sig',
        kid: '778233e8f6f342ea09e867aad25f543adeebf372',
        n:
          // tslint:disable-next-line: max-line-length
          '8MMxQ9F7R1zJ57QvLX-HqUlTVLLofCzZ3-lxohJr8ivJDGZoCqll7ZTNO0nGMgnPpIO-3BQLkaNGQDCpnID1vNIjClFFl0E3cN5bDX15uxCQeQDsm25fTlphpy5FkdoHCviswtrsl2KKUPeRlKqCqMjlDO27KuxIwzIPdNSqv4tseZmI-biFt2JlO9htgODrVqaawdm27t9HcWfOK_a5czRFDHWck2-ZwjbCOF9CtF1ggYm11aV0TElExXr5fgjAQdZ1yGmJvir127BRUgyIy5cpyf7VRRf2Cv7whSMoVJr4W3OK0H9vkuFLnlBiBNYQmH_eWy5U4jBfZjBqvA7Oww',
        e: 'AQAB'
      },
      {
        kty: 'RSA',
        alg: 'RS256',
        use: 'sig',
        kid: '8ec17994394464d95b0b3d906326f1cdde8aee64',
        n:
          // tslint:disable-next-line: max-line-length
          'w49KfvzGWVXH4vyUxvP29_QTmJfvLp4RPT1WlI6Wo2aNvn6j9vRSLDrK2CnOvvrrlUKvR-8FTcyNi9pRKXDwDhEJcyVFBJVi4PqDh0KIX_dOGYCulr5FUvU0HXQxlMWSHIsJjfGbMMUwM0p09y8KHL-kipiipzn80EpBmrI4Q3t6XOAZJSmbIPaGZJDjyoWWV0TDdVDBMfkqII6tOOB7Ha189AZjz7FHYXR9CIc0Jm6rFy0tVpdHFEG3ptcNQEDQ5ghyMM4PDM4ZmQ5uk3WgHVqnpdmGEfKekLwmYFWgnI-ux_MabltIxr9TE1qubEmebM64rOusHBF0mSbEwggbyw',
        e: 'AQAB'
      }
    ]
  },
  customQueryParams: null,
  silentRefreshIFrameName: 'angular-oauth-oidc-silent-refresh-iframe',
  timeoutFactor: 0.75,
  sessionCheckIntervall: 3000,
  sessionCheckIFrameName: 'angular-oauth-oidc-check-session-iframe',
  disableAtHashCheck: false,
  skipSubjectCheck: false
};
