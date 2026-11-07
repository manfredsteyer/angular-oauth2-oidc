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

  describe('postMessage listeners', () => {
    let frame: HTMLIFrameElement;

    const post = (source: Window) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          data: '#code=c&state=s',
          origin: location.origin,
          source,
        })
      );

    beforeEach(() => {
      frame = document.createElement('iframe');
      document.body.appendChild(frame);
    });

    afterEach(() => {
      service.ngOnDestroy();
      frame.remove();
    });

    it('silent refresh only accepts messages from its iframe', () => {
      const tryLogin = spyOn(service, 'tryLogin').and.resolveTo(true);
      frame.id = service.silentRefreshIFrameName;
      // protected; silentRefresh() would also navigate the iframe to the IdP
      (
        service as unknown as { setupSilentRefreshEventListener(): void }
      ).setupSilentRefreshEventListener();

      post(window);
      expect(tryLogin).not.toHaveBeenCalled();

      post(frame.contentWindow);
      expect(tryLogin).toHaveBeenCalledTimes(1);
    });

    it('popup login only accepts messages from its popup', async () => {
      service.configure({
        clientId: 'test-client',
        loginUrl: 'https://auth.example.com/authorize',
        responseType: 'code',
      });
      const tryLogin = spyOn(service, 'tryLogin').and.resolveTo(true);
      const open = spyOn(window, 'open').and.returnValue(frame.contentWindow);

      const login = service.initLoginFlowInPopup();
      while (!open.calls.any()) {
        await new Promise((resolve) => setTimeout(resolve));
      }

      post(window);
      expect(tryLogin).not.toHaveBeenCalled();

      post(frame.contentWindow);
      await expectAsync(login).toBeResolvedTo(true);
      expect(tryLogin).toHaveBeenCalledTimes(1);
    });
  });
});
