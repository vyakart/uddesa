const PBKDF2_ITERATIONS = 100_000;
const HASH_BITS = 256;

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }

  return bytes;
}

export function generateSalt(length: number = 16): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Web Crypto API is not available');
  }

  const bytes = new Uint8Array(length);
  cryptoApi.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPasskey(passkey: string, saltHex: string): Promise<string> {
  if (!passkey) {
    throw new Error('Passkey is required');
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const salt = hexToBytes(saltHex);
  const saltBuffer = new Uint8Array(salt.length);
  saltBuffer.set(salt);
  const encoder = new TextEncoder();
  const passkeyBytes = encoder.encode(passkey);

  const keyMaterial = await cryptoApi.subtle.importKey('raw', passkeyBytes, 'PBKDF2', false, [
    'deriveBits',
  ]);

  const derivedBits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

export async function verifyPasskey(
  passkey: string,
  expectedHashHex: string,
  saltHex: string
): Promise<boolean> {
  if (!passkey || !expectedHashHex || !saltHex) {
    return false;
  }

  const computedHash = await hashPasskey(passkey, saltHex);
  return computedHash === expectedHashHex;
}
