/**
 * HMAC-signed session tokens for the admin cookie.
 *
 * The previous implementation stored the literal string `"authenticated"` in
 * the `admin_auth` cookie and accepted any request that sent that exact value.
 * Because the value was a known constant, any unauthenticated user could
 * bypass authentication by simply setting the cookie themselves.
 *
 * This module issues tamper-proof tokens of the form `<exp>.<nonce>.<sig>`
 * where `sig` is an HMAC-SHA256 over `<exp>.<nonce>` using a server-side
 * secret. Tokens are verified with a constant-time comparison, and expired
 * tokens are rejected.
 *
 * The implementation uses the Web Crypto API so it works in both the Node.js
 * and Edge runtimes (Next.js `middleware.ts` runs on the Edge runtime).
 */

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(sig);
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Resolve the session secret from environment.
 *
 * In production, a missing/short secret is a hard failure (fail-closed) — we
 * refuse to sign or verify tokens rather than accepting a predictable default.
 * In non-production environments we fall back to a process-local random
 * secret so that local dev still works, but sessions won't survive restarts.
 */
let devFallbackSecret: string | null = null;

export function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_SESSION_SECRET is not set or is shorter than 32 characters. Refusing to run in production.',
    );
  }

  if (!devFallbackSecret) {
    devFallbackSecret = randomHex(32);
    console.warn(
      '[admin/session] ADMIN_SESSION_SECRET not set — using an ephemeral dev secret. Sessions will not survive process restarts.',
    );
  }
  return devFallbackSecret;
}

export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week

export async function createSessionToken(
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS,
): Promise<string> {
  const secret = getSessionSecret();
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonce = randomHex(16);
  const payload = `${exp}.${nonce}`;
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [exp, nonce, sig] = parts;
  if (!/^\d+$/.test(exp) || !/^[0-9a-f]+$/i.test(nonce) || !/^[0-9a-f]+$/i.test(sig)) {
    return false;
  }

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }

  const expected = await hmacSha256Hex(secret, `${exp}.${nonce}`);
  if (!constantTimeEqual(expected, sig)) return false;

  const expNum = Number(exp);
  if (!Number.isFinite(expNum)) return false;
  return expNum > Math.floor(Date.now() / 1000);
}
