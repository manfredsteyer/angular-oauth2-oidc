import { Injectable } from '@angular/core';

/**
 * Abstraction for crypto algorithms
*/
export abstract class HashHandler {
    abstract calcHash(valueToHash: string, algorithm: string): Promise<string>;
}

@Injectable()
export class DefaultHashHandler implements HashHandler {

    async calcHash(valueToHash: string, algorithm: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(valueToHash);
        const hashArray = await window.crypto.subtle.digest(algorithm, data);
        return this.toHashString(hashArray);
    }

    toHashString(buffer: ArrayBuffer) {
      const byteArray = new Uint8Array(buffer);
      let result = '';
      for (let e of byteArray) {
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