import { getEnvSettings, loadWorkspaceEnv } from '@/server/feishu/config';
import { resolveFeishuTableLink } from '@/server/feishu/wiki';

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/_+$/, '');
  return trimmed || 'FEISHU_EXHIBITION';
}

async function main() {
  loadWorkspaceEnv();

  const rawLink =
    process.argv[2]?.trim() ||
    process.env.FEISHU_EXHIBITION_WIKI_URL?.trim() ||
    process.env.FEISHU_WIKI_URL?.trim();
  const outputPrefix = normalizePrefix(
    process.argv[3] ?? process.env.FEISHU_OUTPUT_PREFIX ?? 'FEISHU_EXHIBITION'
  );

  if (!rawLink) {
    throw new Error(
      '用法: npx tsx src/scripts/get-wiki-app-token.ts "<飞书 Wiki / Base 链接>" [输出前缀]'
    );
  }

  const settings = getEnvSettings();
  const resolved = await resolveFeishuTableLink(settings, rawLink);

  const envLines = [
    `${outputPrefix}_WIKI_URL=${resolved.raw}`,
    `${outputPrefix}_APP_TOKEN=${resolved.appToken}`,
    ...(resolved.tableId ? [`${outputPrefix}_TABLE_ID=${resolved.tableId}`] : []),
    ...(resolved.viewId ? [`${outputPrefix}_VIEW_ID=${resolved.viewId}`] : []),
  ];

  console.log(envLines.join('\n'));
}

main().catch((error) => {
  console.error('解析飞书表格链接失败:', error);
  process.exit(1);
});
