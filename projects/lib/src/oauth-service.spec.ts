import { HttpParams, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OAuthService } from './oauth-service';
import { provideOAuthClient } from './provider';
import { MemoryStorage, OAuthLogger, OAuthStorage } from './types';

const silentLogger: OAuthLogger = {
  debug: () => undefined,
  info: () => undefined,
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

describe('OAuthService', () => {
  let httpMock: HttpTestingController;
  let service: OAuthService;
  let storage: OAuthStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOAuthClient(),
        { provide: OAuthLogger, useValue: silentLogger },
        { provide: OAuthStorage, useClass: MemoryStorage },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(OAuthService);
    storage = TestBed.inject(OAuthStorage);

    service.configure({
      clientId: 'test-client',
      revocationEndpoint: 'https://auth.example.com/oauth/revoke',
    });
    storage.setItem('access_token', 'access-token');
    storage.setItem('refresh_token', 'refresh-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should accept plain text token revocation responses', async () => {
    const revokePromise = service.revokeTokenAndLogout();

    const requests = httpMock.match('https://auth.example.com/oauth/revoke');
    expect(requests.length).toBe(2);
    expect(
      requests.map((request) =>
        (request.request.body as HttpParams).get('token_type_hint')
      )
    ).toEqual(['access_token', 'refresh_token']);

    for (const request of requests) {
      expect(request.request.method).toBe('POST');
      expect(request.request.responseType).toBe('text');
      expect(request.request.headers.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );
      request.flush('Token revoked');
    }

    await expectAsync(revokePromise).toBeResolved();
  });

  function base64UrlEncode(json: object): string {
    const base64 = btoa(JSON.stringify(json));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function buildIdToken(claims: object): string {
    const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
    const payload = base64UrlEncode(claims);
    // Signature is irrelevant here: processIdToken is only exercised with
    // disableAtHashCheck/skipNonceCheck paths that don't verify it in this test.
    return `${header}.${payload}.signature`;
  }

  it('should have stored the new id_token claims by the time token_received fires and the promise resolves for fetchTokenUsingGrant', async () => {
    const now = Date.now();
    const previousClaims = { sub: 'user-1', tenant: 'tenant-old' };
    const newClaims = {
      sub: 'user-1',
      tenant: 'tenant-new',
      iss: 'https://auth.example.com',
      aud: 'test-client',
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 3600,
    };

    // Simulate an already logged-in user with a previously stored id_token.
    storage.setItem('id_token', buildIdToken(previousClaims));
    storage.setItem('id_token_claims_obj', JSON.stringify(previousClaims));
    storage.setItem('id_token_stored_at', '' + now);
    // No 'nonce' is stored, matching typical custom/token-exchange grant
    // usage (the nonce check only applies to the authorization-code/implicit
    // flow's own id_token); processIdToken() treats undefined === undefined
    // as a pass in that case.

    service.configure({
      clientId: 'test-client',
      issuer: 'https://auth.example.com',
      tokenEndpoint: 'https://auth.example.com/oauth/token',
      oidc: true,
      skipIssuerCheck: true,
      disableAtHashCheck: true,
    });

    let claimsWhenEventFired: any = null;
    service.events.subscribe((e) => {
      if (e.type === 'token_received') {
        claimsWhenEventFired = service.getIdentityClaims();
      }
    });

    const grantPromise = service.fetchTokenUsingGrant(
      'urn:ietf:params:oauth:grant-type:token-exchange',
      { subject_token: 'irrelevant' }
    );

    const req = httpMock.expectOne('https://auth.example.com/oauth/token');
    req.flush({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      id_token: buildIdToken(newClaims),
    });

    const tokenResponse = await grantPromise;

    expect(tokenResponse.access_token).toBe('new-access-token');
    // Both the event handler and the resolved promise must observe the
    // freshly stored claims, not the stale ones from before the call.
    expect(claimsWhenEventFired).toEqual(
      jasmine.objectContaining({ tenant: 'tenant-new' })
    );
    expect(service.getIdentityClaims()).toEqual(
      jasmine.objectContaining({ tenant: 'tenant-new' })
    );
  });
});
