import { HttpParams, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OAuthService } from './oauth-service';
import { provideOAuthClient } from './provider';
import { MemoryStorage, OAuthLogger, OAuthStorage, ParsedIdToken } from './types';

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

  describe('refreshToken and logout', () => {
    beforeEach(() => {
      service.configure({
        tokenEndpoint: 'https://auth.example.com/oauth/token',
      });
    });

    it('keeps a successful refresh working when no logout occurs', async () => {
      const events: string[] = [];
      const subscription = service.events.subscribe((event) =>
        events.push(event.type)
      );
      const pending = service.refreshToken();

      httpMock.expectOne('https://auth.example.com/oauth/token').flush({
        access_token: 'updated-access',
        refresh_token: 'updated-refresh',
        expires_in: 3600,
      });

      await expectAsync(pending).toBeResolved();
      expect(storage.getItem('access_token')).toBe('updated-access');
      expect(storage.getItem('refresh_token')).toBe('updated-refresh');
      expect(events).toContain('token_received');
      expect(events).toContain('token_refreshed');
      subscription.unsubscribe();
    });

    it('cancels a pending refresh and rejects its Promise on logout', async () => {
      const pending = service.refreshToken();
      const request = httpMock.expectOne('https://auth.example.com/oauth/token');

      service.logOut(true);

      await expectAsync(pending).toBeRejectedWithError(
        'Token refresh canceled after logout'
      );
      expect(request.cancelled).toBeTrue();
      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
    });

    it('cancels all independently started refreshes on logout', async () => {
      const events: string[] = [];
      const subscription = service.events.subscribe((event) =>
        events.push(event.type)
      );
      const first = service.refreshToken();
      const second = service.refreshToken();
      const requests = httpMock.match('https://auth.example.com/oauth/token');
      expect(requests.length).toBe(2);

      service.logOut(true);

      await expectAsync(first).toBeRejectedWithError(
        'Token refresh canceled after logout'
      );
      await expectAsync(second).toBeRejectedWithError(
        'Token refresh canceled after logout'
      );
      expect(requests.every((request) => request.cancelled)).toBeTrue();
      expect(events).not.toContain('token_received');
      expect(events).not.toContain('token_refreshed');
      subscription.unsubscribe();
    });

    it('allows a new session to refresh after an old session logs out', async () => {
      const oldRefresh = service.refreshToken();
      const oldRequest = httpMock.expectOne(
        'https://auth.example.com/oauth/token'
      );

      service.logOut(true);
      storage.setItem('refresh_token', 'new-session-refresh');

      const newRefresh = service.refreshToken();
      const newRequest = httpMock.expectOne(
        'https://auth.example.com/oauth/token'
      );
      expect(
        (newRequest.request.body as HttpParams).get('refresh_token')
      ).toBe('new-session-refresh');
      newRequest.flush({
        access_token: 'new-session-access',
        refresh_token: 'new-session-rotated-refresh',
        expires_in: 3600,
      });

      await expectAsync(oldRefresh).toBeRejectedWithError(
        'Token refresh canceled after logout'
      );
      await expectAsync(newRefresh).toBeResolved();
      expect(oldRequest.cancelled).toBeTrue();
      expect(storage.getItem('access_token')).toBe('new-session-access');
      expect(storage.getItem('refresh_token')).toBe(
        'new-session-rotated-refresh'
      );
    });

    it('does not save an ID token processed after logout', async () => {
      service.oidc = true;
      let resolveIdToken!: (token: ParsedIdToken) => void;
      spyOn(service, 'processIdToken').and.returnValue(
        new Promise<ParsedIdToken>((resolve) => {
          resolveIdToken = resolve;
        })
      );

      const pending = service.refreshToken();
      httpMock.expectOne('https://auth.example.com/oauth/token').flush({
        access_token: 'stale-access',
        refresh_token: 'stale-refresh',
        id_token: 'stale-id',
        expires_in: 3600,
      });

      service.logOut(true);
      resolveIdToken({} as ParsedIdToken);

      await expectAsync(pending).toBeRejectedWithError(
        'Token refresh canceled after logout'
      );
      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
      expect(storage.getItem('id_token')).toBeNull();
    });
  });
});
