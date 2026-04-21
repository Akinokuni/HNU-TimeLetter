import { NextResponse } from 'next/server';
import { login, logout } from '@/lib/admin/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const success = await login(password);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ success: true });
}
