import { runSyncJob } from '../lib/sync/orchestrator';

async function main() {
  try {
    const job = await runSyncJob({
      kind: 'sync-data',
      triggeredBy: 'cli',
    });

    if (job.status !== 'success') {
      console.error(job.errors[0] || '同步失败');
      process.exit(1);
    }

    console.log(`同步完成，任务 ID: ${job.jobId}`);
    if (job.summary) {
      console.log(
        `地点数: ${job.summary.locationCount ?? 0}, 故事数: ${job.summary.storyCount ?? 0}, 创作记录数: ${job.summary.creationIdeaCount ?? 0}`,
      );
    }
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  }
}

main();
