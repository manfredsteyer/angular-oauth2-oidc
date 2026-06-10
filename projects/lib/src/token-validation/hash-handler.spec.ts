import { DefaultHashHandler } from './hash-handler';

function toHex(rawHash: string): string {
  return Array.from(rawHash)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

describe('DefaultHashHandler', () => {
  let handler: DefaultHashHandler;

  beforeEach(() => {
    handler = new DefaultHashHandler();
  });

  it('should calculate the correct sha-256 hash for a known vector', async () => {
    const hash = await handler.calcHash('abc', 'sha-256');
    expect(toHex(hash)).toEqual(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('should return a 32 byte hash', async () => {
    const hash = await handler.calcHash('some-nonce-value', 'sha-256');
    expect(hash.length).toBe(32);
  });

  it('should be deterministic', async () => {
    const a = await handler.calcHash('value', 'sha-256');
    const b = await handler.calcHash('value', 'sha-256');
    expect(a).toEqual(b);
  });

  it('should produce different hashes for different inputs', async () => {
    const a = await handler.calcHash('value-a', 'sha-256');
    const b = await handler.calcHash('value-b', 'sha-256');
    expect(a).not.toEqual(b);
  });
});
