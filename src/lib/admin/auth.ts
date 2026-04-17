import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createSessionToken,
  DEFAULT_SESSION_TTL_SECONDS,
  verifySessionToken,
} from './session';

export const ADMIN_COOKIE_NAME = 'admin_auth';

/**
 * Resolve the configured admin password.
 *
 * Previously this fell back to the literal string `"admin"` when
 * `ADMIN_PASSWORD` was unset, which meant any production deployment that
 * forgot to configure the env var had a trivially-guessable password. We now
 * fail closed — in production a missing password causes login to return
 * `false` for every attempt, and a warning is logged at first use.
 */
let warnedAboutMissingPassword = false;
function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw && pw.length > 0) return pw;
  if (!warnedAboutMissingPassword) {
    warnedAboutMissingPassword = true;
    console.warn(
      '[admin/auth] ADMIN_PASSWORD is not set — admin login is disabled until it is configured.',
    );
  }
  return null;
}

/**
 * Constant-time string comparison to avoid leaking information about the
 * configured admin password via response-time side channels.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function checkAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  return verifySessionToken(authCookie?.value);
}

export async function requireAuth() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }
}

export async function login(password: unknown) {
  if (typeof password !== 'string' || password.length === 0) return false;

  const expected = getAdminPassword();
  if (!expected) return false;
  if (!timingSafeEqual(password, expected)) return false;

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DEFAULT_SESSION_TTL_SECONDS,
    path: '/',
  });
  return true;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
