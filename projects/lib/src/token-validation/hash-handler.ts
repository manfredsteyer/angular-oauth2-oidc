import { Injectable } from '@angular/core';

import { factory } from './js-sha256';
// const sha256 = factory();

import fsha256 from './fast-sha256js';

/**
 * Abstraction for crypto algorithms
 */
export abstract class HashHandler {
  abstract calcHash(valueToHash: string, algorithm: string): Promise<string>;
}

function decodeUTF8(s) {
  if (typeof s !== 'string') throw new TypeError('expected string');
  const d = s,
    b = new Uint8Array(d.length);
  for (let i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
  return b;
}

function encodeUTF8(arr) {
  const s = [];
  for (let i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
  return s.join('');
}

@Injectable()
export class DefaultHashHandler implements HashHandler {
  async calcHash(valueToHash: string, algorithm: string): Promise<string> {
    // const encoder = new TextEncoder();
    // const hashArray = await window.crypto.subtle.digest(algorithm, data);
    // const data = encoder.encode(valueToHash);

    // const fhash = fsha256(valueToHash);

    const candHash = encodeUTF8(fsha256(decodeUTF8(valueToHash)));

    // const hashArray = (sha256 as any).array(valueToHash);
    // // const hashString = this.toHashString(hashArray);
    // const hashString = this.toHashString2(hashArray);

    // console.debug('hash orig - cand', candHash, hashString);
    // alert(1);

    return candHash;
  }

  toHashString2(byteArray: number[]) {
    let result = '';
    for (const e of byteArray) {
      result += String.fromCharCode(e);
    }
    return result;
  }

  toHashString(buffer: ArrayBuffer) {
    const byteArray = new Uint8Array(buffer);
    let result = '';
    for (const e of byteArray) {
      result += String.fromCharCode(e);
    }
    return result;
  }

  // hexString(buffer) {
  //     const byteArray = new Uint8Array(buffer);
  //     const hexCodes = [...byteArray].map(value => {
  //       const hexCode = value.toString(16);
  //       const paddedHexCode = hexCode.padStart(2, '0');
  //       return paddedHexCode;
  //     });

  //     return hexCodes.join('');
  //   }

  // toHashString(hexString: string) {
  //   let result = '';
  //   for (let i = 0; i < hexString.length; i += 2) {
  //     let hexDigit = hexString.charAt(i) + hexString.charAt(i + 1);
  //     let num = parseInt(hexDigit, 16);
  //     result += String.fromCharCode(num);
  //   }
  //   return result;
  // }
}
