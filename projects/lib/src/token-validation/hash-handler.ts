import { Injectable } from '@angular/core';

import { sha256 } from './js-sha256';

/**
 * Abstraction for crypto algorithms
 */
export abstract class HashHandler {
  abstract calcHash(valueToHash: string, algorithm: string): Promise<string>;
}

@Injectable()
export class DefaultHashHandler implements HashHandler {
  async calcHash(valueToHash: string, algorithm: string): Promise<string> {
    const hashArray = (sha256 as any).array(valueToHash);
    const hashString = this.toHashString2(hashArray);
    return hashString;
  }

  toHashString2(byteArray: number[]) {
    let result = '';
    for (let e of byteArray) {
      result += String.fromCharCode(e);
    }
    return result;
  }

  toHashString(buffer: ArrayBuffer) {
    const byteArray = new Uint8Array(buffer);
    let result = '';
    for (let e of byteArray) {
      result += String.fromCharCode(e);
    }
    return result;
  }
}
