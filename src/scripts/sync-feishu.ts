import { loadWorkspaceEnv, getEnvSettings } from '@/server/feishu/config';
import { runFeishuSync } from '@/server/feishu/sync';

async function main() {
  try {
    loadWorkspaceEnv(process.cwd());

    console.log('Starting Feishu sync...\n');
    const result = await runFeishuSync(getEnvSettings(), process.cwd());

    console.log(
      `Synced ${result.locationCount} locations / ${result.storyCount} stories`
    );
  } catch (error) {
    console.error('\nSync failed:', error);
    process.exit(1);
  }
}

void main();
