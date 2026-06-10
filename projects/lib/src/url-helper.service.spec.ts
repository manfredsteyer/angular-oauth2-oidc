import { UrlHelperService } from './url-helper.service';

describe('UrlHelperService', () => {
  let service: UrlHelperService;

  beforeEach(() => {
    service = new UrlHelperService();
  });

  describe('parseQueryString', () => {
    it('should parse key/value pairs', () => {
      expect(service.parseQueryString('code=abc&state=xyz')).toEqual({
        code: 'abc',
        state: 'xyz',
      });
    });

    it('should return an empty object for null', () => {
      expect(service.parseQueryString(null)).toEqual({});
    });

    it('should decode URI encoded keys and values', () => {
      expect(
        service.parseQueryString('redirect_uri=https%3A%2F%2Fexample.com%2Fcb')
      ).toEqual({
        redirect_uri: 'https://example.com/cb',
      });
    });

    it('should strip a leading slash from keys', () => {
      expect(service.parseQueryString('/code=abc')).toEqual({ code: 'abc' });
    });

    it('should keep the value of the first separator for values containing =', () => {
      expect(service.parseQueryString('token=a=b')).toEqual({ token: 'a=b' });
    });
  });

  describe('getHashFragmentParams', () => {
    it('should parse params from a custom hash fragment', () => {
      expect(
        service.getHashFragmentParams('#access_token=abc&state=xyz')
      ).toEqual({
        access_token: 'abc',
        state: 'xyz',
      });
    });

    it('should parse params after a question mark inside the hash', () => {
      expect(service.getHashFragmentParams('#/some/route?code=abc')).toEqual({
        code: 'abc',
      });
    });

    it('should return an empty object if the fragment does not start with #', () => {
      expect(service.getHashFragmentParams('access_token=abc')).toEqual({});
    });
  });
});
