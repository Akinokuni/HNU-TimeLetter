import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/admin/auth';
import { getAdminConfig, updateAdminConfig } from '@/lib/admin/config';
import { startSyncJob, stopSyncJob, runSyncTask } from '@/lib/admin/scheduler';

/**
 * Validate a user-supplied cron expression before we hand it to node-schedule.
 *
 * The admin dashboard lets authenticated users change the sync cron string;
 * we still want to reject grossly malformed input (overly long strings,
 * unexpected characters) so bugs in the schedule parser or mistyped values
 * can't destabilise the running scheduler. We only accept the characters that
 * appear in standard cron expressions.
 */
const CRON_ALLOWED = /^[0-9*,/\-?LW# ]+$/;
function isValidCron(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return false;
  if (!CRON_ALLOWED.test(trimmed)) return false;
  const fields = trimmed.split(/\s+/);
  // node-schedule accepts 5 or 6 field cron expressions.
  return fields.length === 5 || fields.length === 6;
}

export async function GET() {
  const isAuth = await checkAuth();
  if (!isAuth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const config = getAdminConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const isAuth = await checkAuth();
  if (!isAuth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, cron, enabled } = body ?? {};

    if (action === 'trigger') {
      // 异步执行同步
      runSyncTask();
      return NextResponse.json({ message: 'Sync triggered' });
    }

    if (action === 'update') {
      const currentConfig = getAdminConfig();

      let nextCron = currentConfig.sync.cron;
      if (cron !== undefined && cron !== null && cron !== '') {
        if (!isValidCron(cron)) {
          return NextResponse.json(
            { message: 'Invalid cron expression' },
            { status: 400 },
          );
        }
        nextCron = cron.trim();
      }

      const nextEnabled =
        typeof enabled === 'boolean' ? enabled : currentConfig.sync.enabled;

      const newConfig = updateAdminConfig({
        sync: {
          ...currentConfig.sync,
          enabled: nextEnabled,
          cron: nextCron,
        },
      });

      // Update scheduler
      if (newConfig.sync.enabled) {
        startSyncJob(newConfig.sync.cron);
      } else {
        stopSyncJob();
      }

      return NextResponse.json(newConfig);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
