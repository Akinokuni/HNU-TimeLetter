import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin/auth';
import { getJob } from '@/lib/sync/job-store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await context.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
