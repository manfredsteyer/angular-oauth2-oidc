import { OAuthStorage } from 'angular-oauth2-oidc';

export class DemoStorage implements OAuthStorage {

  private storage: object = {};

  getItem(key: string): string {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  setItem(key: string, data: string): void {
    console.debug('storage: setting key', key);
    localStorage.setItem(key, data);
  }

}
