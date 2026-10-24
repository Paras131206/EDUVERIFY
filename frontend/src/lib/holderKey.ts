import { API_BASE_URL, authFetch } from '@/lib/api';

const DB_NAME = 'eduverify_holder_db';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const KEY_NAME = 'holder_keypair';

export interface StoredHolderKey {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JsonWebKey;
  createdAt: string;
}

export function base64urlEncode(input: Uint8Array | string): string {
  const bytes: Uint8Array =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Open IndexedDB for holder cryptographic custody
 */
function openHolderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve existing holder key from IndexedDB
 */
export async function getStoredHolderKey(): Promise<StoredHolderKey | null> {
  try {
    const db = await openHolderDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Store holder key in IndexedDB
 */
async function saveHolderKey(record: StoredHolderKey): Promise<void> {
  const db = await openHolderDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record, KEY_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete key from IndexedDB (e.g. simulated clear or re-issue request)
 */
export async function clearHolderKey(): Promise<void> {
  try {
    const db = await openHolderDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Get or initialize holder key with WebCrypto ECDSA P-256 (extractable: false).
 * Automatically registers the public JWK via POST /v1/credentials/holder-key.
 */
export async function getOrInitHolderKey(autoRegister = true): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JsonWebKey;
  isNew: boolean;
}> {
  const existing = await getStoredHolderKey();
  if (existing && existing.privateKey) {
    return {
      privateKey: existing.privateKey,
      publicKey: existing.publicKey,
      publicJwk: existing.publicJwk,
      isNew: false,
    };
  }

  // Generate ECDSA P-256 key pair with extractable: false for private key
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // PRIVATE KEY NEVER EXTRACTABLE
    ['sign']
  );

  const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);

  const newRecord: StoredHolderKey = {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicJwk,
    createdAt: new Date().toISOString(),
  };

  await saveHolderKey(newRecord);

  if (autoRegister) {
    try {
      await authFetch(`${API_BASE_URL}/v1/credentials/holder-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jwk: publicJwk,
          device_label: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser Device',
          created_at: newRecord.createdAt,
        }),
      });
    } catch (err) {
      console.warn('Failed to register holder public JWK with backend:', err);
    }
  }

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicJwk,
    isNew: true,
  };
}

/**
 * Sign Key-Binding JWT (KB-JWT) over nonce, aud, and sd_hash per SD-JWT spec.
 */
export async function signKbJwt(
  privateKey: CryptoKey,
  nonce: string,
  aud: string,
  sdHash: string
): Promise<string> {
  const header = {
    typ: 'kb+jwt',
    alg: 'ES256',
  };

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    nonce,
    aud,
    sd_hash: sdHash,
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const dataToSign = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const signatureBuffer = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    dataToSign
  );

  const sigB64 = base64urlEncode(new Uint8Array(signatureBuffer));
  return `${headerB64}.${payloadB64}.${sigB64}`;
}
