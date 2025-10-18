/**
 * Cryptography utilities for encrypting and decrypting diary data
 * 
 * Uses Web Crypto API with:
 * - PBKDF2 for key derivation from passwords
 * - AES-GCM for encryption/decryption
 * - Random salt generation per diary
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
}

/**
 * Generate a cryptographically secure random salt
 * 
 * @returns Base64-encoded salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToBase64(salt);
}

/**
 * Derive a cryptographic key from a password using PBKDF2
 * 
 * @param password - User password
 * @param salt - Base64-encoded salt
 * @returns CryptoKey for encryption/decryption
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltArray = base64ToArrayBuffer(salt);
  const saltBuffer = saltArray.buffer.slice(0) as ArrayBuffer;

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt data using AES-GCM
 * 
 * @param data - Plain text data to encrypt
 * @param password - Encryption password
 * @param salt - Optional salt (generates new one if not provided)
 * @returns Encrypted data with IV and salt
 */
export async function encrypt(
  data: string,
  password: string,
  salt?: string,
): Promise<EncryptedData> {
  try {
    // Generate or use provided salt
    const actualSalt = salt || generateSalt();

    // Derive encryption key
    const key = await deriveKey(password, actualSalt);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encode the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer,
    );

    return {
      ciphertext: arrayBufferToBase64(new Uint8Array(ciphertextBuffer)),
      iv: arrayBufferToBase64(iv),
      salt: actualSalt,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        module: 'crypto',
        message: 'Encryption failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data using AES-GCM
 * 
 * @param encryptedData - Encrypted data with IV and salt
 * @param password - Decryption password
 * @returns Decrypted plain text
 * @throws Error if decryption fails (wrong password or corrupted data)
 */
export async function decrypt(
  encryptedData: EncryptedData,
  password: string,
): Promise<string> {
  try {
    // Derive decryption key
    const key = await deriveKey(password, encryptedData.salt);

    // Decode the ciphertext and IV
    const ciphertextBuffer = base64ToArrayBuffer(encryptedData.ciphertext);
    const ivArray = base64ToArrayBuffer(encryptedData.iv);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray as unknown as BufferSource,
      },
      key,
      ciphertextBuffer as unknown as BufferSource,
    );

    // Decode the decrypted data
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        module: 'crypto',
        message: 'Decryption failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    throw new Error('Decryption failed - wrong password or corrupted data');
  }
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Strength score (0-4) and feedback
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (password.length >= 12) {
    score++;
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include lowercase letters');
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include uppercase letters');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Include numbers');
  }

  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include special characters');
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(Math.floor((score / 6) * 4), 4);

  return {
    score: normalizedScore,
    feedback,
    isStrong: normalizedScore >= 3,
  };
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const bytes = Array.from(buffer);
  const binary = bytes.map((byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password for verification (without encryption)
 * This is for checking if a password is correct without decrypting data
 * 
 * @param password - Password to hash
 * @param salt - Salt to use
 * @returns Base64-encoded hash
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await deriveKey(password, salt);
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(new Uint8Array(exported));
}
