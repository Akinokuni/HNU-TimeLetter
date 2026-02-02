/**
 * 直接测试飞书表格记录读取
 * 假设 FEISHU_TABLE_ID 就是 table_id
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;

const FEISHU_AUTH_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/';

async function getTenantAccessToken(): Promise<string> {
  const response = await fetch(FEISHU_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json();
  return data.tenant_access_token;
}

async function main() {
  console.log('🔍 测试不同的 API 端点...\n');
  
  const token = await getTenantAccessToken();
  console.log('✅ 令牌获取成功\n');
  
  // 尝试 1: 假设 FEISHU_TABLE_ID 是完整的 URL 或者包含 app_token
  console.log('📝 FEISHU_TABLE_ID 值:', FEISHU_TABLE_ID);
  console.log('');
  
  // 尝试 2: 列出所有可访问的多维表格
  console.log('📋 尝试列出所有多维表格...');
  const listUrl = 'https://open.feishu.cn/open-apis/bitable/v1/apps';
  const listResponse = await fetch(listUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const listData = await listResponse.json();
  console.log('响应:', JSON.stringify(listData, null, 2));
}

main().catch(console.error);
