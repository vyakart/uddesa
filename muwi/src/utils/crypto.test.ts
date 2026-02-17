import {
  bytesToHex,
  generateSalt,
  hashPasskey,
  hexToBytes,
  verifyPasskey,
} from './crypto';

describe('crypto utils', () => {
  it('encodes and decodes hex values', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 255]);
    const hex = bytesToHex(bytes);

    expect(hex).toBe('00010f10ff');
    expect(Array.from(hexToBytes(hex))).toEqual([0, 1, 15, 16, 255]);
  });

  it('generates random salts as hex strings', () => {
    const saltA = generateSalt();
    const saltB = generateSalt();

    expect(saltA).toMatch(/^[0-9a-f]+$/);
    expect(saltA).toHaveLength(32);
    expect(saltB).toHaveLength(32);
    expect(saltA).not.toBe(saltB);
  });

  it('hashes deterministically for the same passkey and salt', async () => {
    const salt = '00112233445566778899aabbccddeeff';
    const hashA = await hashPasskey('my-passkey', salt);
    const hashB = await hashPasskey('my-passkey', salt);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });

  it('changes hash when salt changes', async () => {
    const hashA = await hashPasskey('my-passkey', '00112233445566778899aabbccddeeff');
    const hashB = await hashPasskey('my-passkey', 'ffeeddccbbaa99887766554433221100');

    expect(hashA).not.toBe(hashB);
  });

  it('verifies passkeys against stored hash and salt', async () => {
    const salt = generateSalt();
    const hash = await hashPasskey('correct-horse', salt);

    await expect(verifyPasskey('correct-horse', hash, salt)).resolves.toBe(true);
    await expect(verifyPasskey('wrong-pass', hash, salt)).resolves.toBe(false);
  });

  it('throws for invalid inputs where expected', async () => {
    expect(() => hexToBytes('xyz')).toThrow('Invalid hex string');
    await expect(hashPasskey('', '00112233445566778899aabbccddeeff')).rejects.toThrow(
      'Passkey is required'
    );
  });
});

