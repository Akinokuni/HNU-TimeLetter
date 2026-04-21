import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createSessionToken,
  getAdminCookieName,
  getSessionMaxAgeSeconds,
  isValidAdminPassword,
  verifySessionToken,
} from './session';

export async function checkAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(getAdminCookieName());
  return verifySessionToken(authCookie?.value);
}

export async function requireAuth() {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }
}

export async function login(password: string) {
  if (isValidAdminPassword(password)) {
    const cookieStore = await cookies();
    cookieStore.set(getAdminCookieName(), await createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: getSessionMaxAgeSeconds(),
      sameSite: 'lax',
      path: '/',
    });
    return true;
  }
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(getAdminCookieName());
}
