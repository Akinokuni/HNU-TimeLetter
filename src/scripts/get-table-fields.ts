/**
 * 获取飞书多维表格的字段信息
 */

import { config } from 'dotenv';
import type { FeishuField } from '../lib/feishu-types';

config({ path: '.env.local' });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;

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
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/fields`;
  
  console.log("\n📡 请求表格字段信息");
  console.log("URL:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });

  const json = await res.json();
  console.log("\n📥 字段响应:", JSON.stringify(json, null, 2));
  
  if (json.code !== 0) {
    throw new Error(`Get Fields Failed: ${json.msg} (code: ${json.code})`);
  }
  
  return json;
}

async function main() {
  try {
    console.log("🚀 开始获取表格字段信息\n");

    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
      throw new Error("缺少必要的环境变量");
    }

    const token = await getTenantToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    console.log("✅ 获取令牌成功");

    const result = await getTableFields(token);
    
    console.log("\n✅ 成功获取字段信息!");
    console.log("\n📋 字段列表:");
    (result.data?.items as FeishuField[] | undefined)?.forEach((field) => {
      console.log(`  - ${field.field_name} (${field.type}) [ID: ${field.field_id}]`);
    });

  } catch (error) {
    console.error("\n❌ 获取失败:", error);
    process.exit(1);
  }
}

main();
