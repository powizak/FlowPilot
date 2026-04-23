import { describe, it, expect } from 'vitest';
import { uuid } from './uuid.js';

describe('uuid', () => {
  it('matches RFC 4122 v4 format when crypto.randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    try {
      const result = uuid();
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: globalThis.globalThis.crypto,
        writable: true,
        configurable: true,
      });
    }
  });

  it('sets version nibble to 4 and variant nibble in 8/9/a/b when using getRandomValues fallback', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues(bytes: ArrayBufferView) {
          const arr = new Uint8Array(
            bytes.buffer,
            bytes.byteOffset,
            bytes.byteLength,
          );
          arr.fill(0);
          arr[0] = 0x12;
          arr[1] = 0x34;
          arr[2] = 0x56;
          arr[3] = 0x78;
          arr[4] = 0x9a;
          arr[5] = 0xbc;
          arr[6] = 0xde;
          arr[7] = 0xf0;
          arr[8] = 0x12;
          arr[9] = 0x34;
          arr[10] = 0x56;
          arr[11] = 0x78;
          arr[12] = 0x9a;
          arr[13] = 0xbc;
          arr[14] = 0xde;
          arr[15] = 0xf0;
        },
      },
      writable: true,
      configurable: true,
    });
    try {
      const result = uuid();
      const versionNibble = parseInt(result[14], 16);
      const variantNibble = parseInt(result[19], 16);
      expect(versionNibble).toBe(4);
      expect([8, 9, 10, 11]).toContain(variantNibble);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }
  });
});
