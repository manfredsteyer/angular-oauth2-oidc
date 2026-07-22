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

  public parseQueryString(queryString: string): object {
    const data = {};
    let pair, separatorIndex, escapedKey, escapedValue, key, value;

    if (queryString === null) {
      return data;
    }

    const pairs = queryString.split('&');

    for (let i = 0; i < pairs.length; i++) {
      pair = pairs[i];
      separatorIndex = pair.indexOf('=');

      if (separatorIndex === -1) {
        escapedKey = pair;
        escapedValue = null;
      } else {
        escapedKey = pair.substring(0, separatorIndex);
        escapedValue = pair.substring(separatorIndex + 1);
      }

      key = decodeURIComponent(escapedKey);
      value = decodeURIComponent(escapedValue);

      if (key.substring(0, 1) === '/') {
        key = key.substring(1);
      }

      data[key] = value;
    }

    return data;
  }
}
