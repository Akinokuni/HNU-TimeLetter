import * as fs from 'fs';
import { getJobLogPath } from './paths';

function formatPart(part: unknown) {
  if (part instanceof Error) {
    return `${part.name}: ${part.message}`;
  }

  if (typeof part === 'string') {
    return part;
  }

  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

export interface SyncLogger {
  info: (...parts: unknown[]) => void;
  warn: (...parts: unknown[]) => void;
  error: (...parts: unknown[]) => void;
  logPath: string;
}

export function createSyncLogger(jobId: string): SyncLogger {
  const logPath = getJobLogPath(jobId);

  const writeLine = (level: 'INFO' | 'WARN' | 'ERROR', parts: unknown[]) => {
    const line = `[${new Date().toISOString()}] [${level}] ${parts
      .map(formatPart)
      .join(' ')}`;

    fs.appendFileSync(logPath, `${line}\n`, 'utf-8');

    if (level === 'WARN') {
      console.warn(line);
      return;
    }

    if (level === 'ERROR') {
      console.error(line);
      return;
    }

    console.log(line);
  };

  return {
    info: (...parts) => writeLine('INFO', parts),
    warn: (...parts) => writeLine('WARN', parts),
    error: (...parts) => writeLine('ERROR', parts),
    logPath,
  };
}
