import { base64urlEncode, base64urlDecode, signKbJwt } from './holderKey';

export interface DecodedDisclosure {
  salt: string;
  key: string;
  value: any;
  raw: string;
  digest: string;
}

/**
 * Compute SHA-256 digest in base64url format
 */
export async function sha256Base64Url(data: string): Promise<string> {
  const buf = new TextEncoder().encode(data);
  const hash = await window.crypto.subtle.digest('SHA-256', buf);
  return base64urlEncode(new Uint8Array(hash));
}

/**
 * Creates an SD-JWT disclosure string: base64url([salt, key, value])
 */
export function createDisclosure(salt: string, key: string, value: any): string {
  const json = JSON.stringify([salt, key, value]);
  return base64urlEncode(json);
}

/**
 * Parses an encoded disclosure string into [salt, key, value]
 */
export function parseDisclosure(encoded: string): { salt: string; key: string; value: any } {
  const json = base64urlDecode(encoded);
  const arr = JSON.parse(json);
  return {
    salt: arr[0],
    key: arr[1],
    value: arr[2],
  };
}

/**
 * Builds an SD-JWT presentation containing only the chosen disclosures + signed KB-JWT.
 * Standard format: <Issuer-JWT>~<Chosen-Disclosure-1>~...~<Chosen-Disclosure-N>~<KB-JWT>
 */
export async function buildSelectivePresentation(
  rawSdJwt: string,
  selectedKeys: string[],
  audience: string,
  nonce: string,
  holderPrivateKey: CryptoKey
): Promise<{
  presentation: string;
  disclosedClaims: Record<string, any>;
  sdHash: string;
  kbJwt: string;
}> {
  const parts = rawSdJwt.split('~');
  const issuerJwt = parts[0];
  const disclosureStrings = parts.slice(1).filter((p) => p.length > 0);

  const chosenDisclosures: string[] = [];
  const disclosedClaims: Record<string, any> = {};

  for (const disc of disclosureStrings) {
    try {
      const parsed = parseDisclosure(disc);
      if (selectedKeys.includes(parsed.key)) {
        chosenDisclosures.push(disc);
        disclosedClaims[parsed.key] = parsed.value;
      }
    } catch {
      // ignore malformed disclosure
    }
  }

  // Construct SD-JWT without KB-JWT (ends with a trailing tilde)
  const presentationWithoutKb = `${issuerJwt}~${chosenDisclosures.join('~')}~`;

  // Compute sd_hash of presentationWithoutKb
  const sdHash = await sha256Base64Url(presentationWithoutKb);

  // Sign KB-JWT with holder's private key
  const kbJwt = await signKbJwt(holderPrivateKey, nonce, audience, sdHash);

  // Full presentation string: <Issuer-JWT>~<Disc1>~<Disc2>~<KB-JWT>
  const presentation = `${presentationWithoutKb}${kbJwt}`;

  return {
    presentation,
    disclosedClaims,
    sdHash,
    kbJwt,
  };
}

/**
 * Decodes and inspects an SD-JWT presentation for verification
 */
export function parsePresentation(presentation: string): {
  issuerJwt: string;
  disclosures: DecodedDisclosure[];
  disclosedClaims: Record<string, any>;
  kbJwtRaw: string | null;
  kbJwtPayload: any | null;
} {
  const parts = presentation.split('~');
  const issuerJwt = parts[0];
  const lastPart = parts[parts.length - 1];

  let kbJwtRaw: string | null = null;
  let kbJwtPayload: any | null = null;
  const disclosureParts: string[] = [];

  // If the last part has two dots, it's a KB-JWT
  if (lastPart && lastPart.includes('.')) {
    kbJwtRaw = lastPart;
    try {
      const jwtParts = lastPart.split('.');
      if (jwtParts.length === 3) {
        kbJwtPayload = JSON.parse(base64urlDecode(jwtParts[1]));
      }
    } catch {
      // ignore
    }
    disclosureParts.push(...parts.slice(1, parts.length - 1).filter((p) => p.length > 0));
  } else {
    disclosureParts.push(...parts.slice(1).filter((p) => p.length > 0));
  }

  const disclosures: DecodedDisclosure[] = [];
  const disclosedClaims: Record<string, any> = {};

  for (const p of disclosureParts) {
    try {
      const parsed = parseDisclosure(p);
      disclosures.push({
        salt: parsed.salt,
        key: parsed.key,
        value: parsed.value,
        raw: p,
        digest: '',
      });
      disclosedClaims[parsed.key] = parsed.value;
    } catch {
      // ignore malformed
    }
  }

  return {
    issuerJwt,
    disclosures,
    disclosedClaims,
    kbJwtRaw,
    kbJwtPayload,
  };
}
