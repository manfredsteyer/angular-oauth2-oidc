import { Injectable } from '@angular/core';

@Injectable()
export class UrlHelperService {
  public getHashFragmentParams(customHashFragment?: string): object {
    let hash = customHashFragment || window.location.hash;

    hash = decodeURIComponent(hash);

    if (hash.indexOf('#') !== 0) {
      return {};
    }

    const questionMarkPosition = hash.indexOf('?');

    if (questionMarkPosition > -1) {
      hash = hash.substring(questionMarkPosition + 1);
    } else {
      hash = hash.substring(1);
    }

    return this.parseQueryString(hash);
  }

  public parseQueryString(queryString: string | null): object {
    const data: Record<string, string> = {};

    if (queryString === null) {
      return data;
    }

    const pairs = queryString.split('&');

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const separatorIndex = pair.indexOf('=');

      let escapedKey: string;
      let escapedValue: string | null;

      if (separatorIndex === -1) {
        escapedKey = pair;
        escapedValue = null;
      } else {
        escapedKey = pair.substring(0, separatorIndex);
        escapedValue = pair.substring(separatorIndex + 1);
      }

      let key = decodeURIComponent(escapedKey);
      const value = decodeURIComponent(escapedValue);

      if (key.substring(0, 1) === '/') {
        key = key.substring(1);
      }

      data[key] = value;
    }

    return data;
  }
}
