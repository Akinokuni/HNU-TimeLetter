import { spawn } from 'child_process';
import type { SyncLogger } from '../logger';

function runCommand(command: string, logger: SyncLogger, label: string) {
  return new Promise<void>((resolve, reject) => {
    logger.info(`${label} started: ${command}`);

    const child = spawn(command, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      logger.info(`[${label}] ${String(chunk).trimEnd()}`);
    });

    child.stderr.on('data', (chunk) => {
      logger.error(`[${label}] ${String(chunk).trimEnd()}`);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        logger.info(`${label} finished successfully`);
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function waitForHealthCheck(logger: SyncLogger) {
  const url = process.env.SYNC_HEALTHCHECK_URL;
  if (!url) {
    return;
  }

  const timeoutMs = Number(process.env.SYNC_HEALTHCHECK_TIMEOUT_MS || 60_000);
  const intervalMs = Number(process.env.SYNC_HEALTHCHECK_INTERVAL_MS || 2_000);
  const deadline = Date.now() + timeoutMs;

  logger.info(`Healthcheck started: ${url}`);

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        logger.info(`Healthcheck passed: ${url}`);
        return;
      }

      logger.warn(`Healthcheck returned ${response.status}: ${url}`);
    } catch (error) {
      logger.warn('Healthcheck request failed', error);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Healthcheck timed out: ${url}`);
}

export async function runBuildAndRestart(logger: SyncLogger) {
  const buildCommand = process.env.SYNC_BUILD_COMMAND || 'npm run build';
  const restartCommand = process.env.SYNC_RESTART_COMMAND;

  await runCommand(buildCommand, logger, 'build');

  if (!restartCommand || !restartCommand.trim()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SYNC_RESTART_COMMAND is required for publish jobs in production',
      );
    }

    logger.warn(
      'SYNC_RESTART_COMMAND is not configured; skipping restart outside production',
    );
    return;
  }

  await runCommand(restartCommand, logger, 'restart');
  await waitForHealthCheck(logger);
}
