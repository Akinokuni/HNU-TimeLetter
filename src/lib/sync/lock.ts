import * as fs from 'fs';
import { ensureSyncPaths, getSyncPaths } from './paths';

export interface SyncLockRecord {
  jobId: string;
  pid: number;
  createdAt: string;
  expiresAt: string;
}

const DEFAULT_LOCK_TIMEOUT_MS = 30 * 60 * 1000;

function getLockTimeoutMs() {
  const raw = process.env.SYNC_LOCK_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_LOCK_TIMEOUT_MS;
}

export class SyncConflictError extends Error {
  currentJobId: string | null;

  constructor(message: string, currentJobId: string | null) {
    super(message);
    this.name = 'SyncConflictError';
    this.currentJobId = currentJobId;
  }
}

export function getCurrentLock() {
  ensureSyncPaths();
  const { lockPath } = getSyncPaths();

  if (!fs.existsSync(lockPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(lockPath, 'utf-8'),
    ) as SyncLockRecord;

    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      fs.unlinkSync(lockPath);
      return null;
    }

    return parsed;
  } catch {
    fs.unlinkSync(lockPath);
    return null;
  }
}

export function acquireSyncLock(jobId: string) {
  ensureSyncPaths();
  const { lockPath } = getSyncPaths();
  const existing = getCurrentLock();

  if (existing) {
    throw new SyncConflictError('已有同步任务正在执行', existing.jobId);
  }

  const now = new Date();
  const lockRecord: SyncLockRecord = {
    jobId,
    pid: process.pid,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + getLockTimeoutMs()).toISOString(),
  };

  try {
    fs.writeFileSync(lockPath, JSON.stringify(lockRecord, null, 2), {
      encoding: 'utf-8',
      flag: 'wx',
    });
  } catch {
    const current = getCurrentLock();
    throw new SyncConflictError('已有同步任务正在执行', current?.jobId ?? null);
  }

  return lockRecord;
}

export function releaseSyncLock(jobId: string) {
  ensureSyncPaths();
  const { lockPath } = getSyncPaths();

  if (!fs.existsSync(lockPath)) {
    return;
  }

  try {
    const current = JSON.parse(
      fs.readFileSync(lockPath, 'utf-8'),
    ) as SyncLockRecord;

    if (current.jobId === jobId) {
      fs.unlinkSync(lockPath);
    }
  } catch {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  }
}
