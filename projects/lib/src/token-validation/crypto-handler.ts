/**
 * Abstraction for crypto algorithms
*/
export abstract class CryptoHandler {

    abstract calcHash(valueToHash: string, algorithm: string): Promise<string>;

}