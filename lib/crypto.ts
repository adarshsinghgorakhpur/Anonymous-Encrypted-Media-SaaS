export const ENCRYPTION_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer.slice(0, bytes.length);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

export interface EncryptResult {
  encryptedBlob: Blob;
  iv: string;
  salt: string;
  password: string;
}

export async function encryptFile(file: File, userPassword?: string): Promise<EncryptResult> {
  const password = userPassword || arrayBufferToBase64(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);

  const key = await deriveKey(password, salt);
  const arrayBuffer = await file.arrayBuffer();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  return {
    encryptedBlob: new Blob([encrypted]),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    password,
  };
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  password: string,
  ivBase64: string,
  saltBase64: string
): Promise<ArrayBuffer> {
  console.debug('[XCrypt Decrypt] Input - encData:', encryptedData.byteLength, 'bytes, pw:', password.substring(0, 8) + '...');
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  console.debug('[XCrypt Decrypt] IV length:', iv.length, 'Salt length:', salt.length);
  const key = await deriveKey(password, salt);
  console.debug('[XCrypt Decrypt] Key derived successfully');

  try {
    const result = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    console.debug('[XCrypt Decrypt] Decryption successful:', result.byteLength, 'bytes');
    return result;
  } catch (err) {
    console.error('[XCrypt Decrypt] Decryption failed:', err);
    throw err;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateRandomBytes(16);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(bits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return arrayBufferToBase64(combined.buffer);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const combined = new Uint8Array(base64ToArrayBuffer(storedHash));
  const salt = combined.slice(0, 16);
  const storedHashPart = combined.slice(16);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const newHash = new Uint8Array(bits);
  if (newHash.length !== storedHashPart.length) return false;
  return newHash.every((byte, i) => byte === storedHashPart[i]);
}

export async function encryptText(
  text: string,
  password: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

export async function decryptText(
  encryptedBase64: string,
  password: string,
  ivBase64: string,
  saltBase64: string
): Promise<string> {
  const decrypted = await decryptFile(
    base64ToArrayBuffer(encryptedBase64),
    password,
    ivBase64,
    saltBase64
  );

  return new TextDecoder().decode(decrypted);
}
