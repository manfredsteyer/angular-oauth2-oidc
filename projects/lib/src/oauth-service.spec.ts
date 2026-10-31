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

  describe('loadDiscoveryDocument', () => {
    const issuer = 'https://auth.example.com';
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
    const offIssuerUrl = 'https://evil.example.org/x';
    const validDoc = {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      revocation_endpoint: `${issuer}/revoke`,
      userinfo_endpoint: `${issuer}/userinfo`,
      end_session_endpoint: `${issuer}/logout`,
    };

    beforeEach(() => {
      service.configure({ clientId: 'test-client', issuer });
    });

    it('should accept a discovery document whose endpoints match the issuer', async () => {
      const promise = service.loadDiscoveryDocument();
      httpMock.expectOne(discoveryUrl).flush(validDoc);

      await expectAsync(promise).toBeResolved();
      expect(service.tokenEndpoint).toBe(validDoc.token_endpoint);
    });

    for (const endpoint of ['token_endpoint', 'revocation_endpoint']) {
      it(`should reject a discovery document with an off-issuer ${endpoint}`, async () => {
        const promise = service.loadDiscoveryDocument();
        httpMock
          .expectOne(discoveryUrl)
          .flush({ ...validDoc, [endpoint]: offIssuerUrl });

        await expectAsync(promise).toBeRejectedWith(
          'discovery_document_validation_error'
        );
        expect(service.tokenEndpoint).not.toBe(offIssuerUrl);
        expect(service.revocationEndpoint).not.toBe(offIssuerUrl);
      });
    }

    it('should accept an off-issuer token_endpoint when strictDiscoveryDocumentValidation is false', async () => {
      service.configure({
        clientId: 'test-client',
        issuer,
        strictDiscoveryDocumentValidation: false,
      });
      const promise = service.loadDiscoveryDocument();
      httpMock
        .expectOne(discoveryUrl)
        .flush({ ...validDoc, token_endpoint: offIssuerUrl });

      await expectAsync(promise).toBeResolved();
      expect(service.tokenEndpoint).toBe(offIssuerUrl);
    });
  });
});
