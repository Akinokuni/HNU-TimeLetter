import type { SyncLogger } from '../logger';
import { runBuildAndRestart } from './build-and-restart';

export async function publishBuildTimeData(logger: SyncLogger) {
  await runBuildAndRestart(logger);
}
