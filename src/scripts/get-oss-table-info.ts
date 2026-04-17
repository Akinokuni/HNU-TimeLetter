/**
 * 获取 OSS 文件记录表格信息
 */

import { config } from 'dotenv';
import type { FeishuField } from '../lib/feishu-types';

config({ path: '.env.local' });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
const OSS_TABLE_ID = 'tblwLUNdWNzv1kZw'; // OSS 文件记录表

async function getTenantToken(appId: string, appSecret: string): Promise<string> {
  const url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`Auth Failed: ${json.msg}`);
  return json.tenant_access_token as string;
}

async function getTableFields(token: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${OSS_TABLE_ID}/fields`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`Get Fields Failed: ${json.msg} (code: ${json.code})`);
  }
  
  return json;
}

async function main() {
  try {
    console.log("🚀 获取 OSS 文件记录表格信息\n");

    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_APP_TOKEN) {
      throw new Error("缺少必要的环境变量");
    }

    const token = await getTenantToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    console.log("✅ 获取令牌成功\n");

    const result = await getTableFields(token);
    
    console.log("✅ 成功获取字段信息!\n");
    console.log("📋 字段列表:");
    (result.data?.items as FeishuField[] | undefined)?.forEach((field) => {
      console.log(`  - ${field.field_name} (${field.type}) [ID: ${field.field_id}]`);
    });

    console.log("\n📝 表格 ID:", OSS_TABLE_ID);

  } catch (error) {
    console.error("\n❌ 获取失败:", error);
    process.exit(1);
  }
}

main();
