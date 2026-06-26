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
});
