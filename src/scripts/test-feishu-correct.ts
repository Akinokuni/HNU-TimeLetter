/**
 * 使用正确的 app_token 和 table_id 测试飞书 API
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
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
  if (data.code !== 0) {
    throw new Error(`获取令牌失败: ${data.msg}`);
  }
  return data.tenant_access_token;
}

async function getTableFields(token: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/fields`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
}

async function getTableRecords(token: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records?page_size=100`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
}

async function main() {
  console.log('🔍 开始读取飞书多维表格数据...\n');
  
  console.log('配置信息:');
  console.log('APP_TOKEN:', FEISHU_APP_TOKEN);
  console.log('TABLE_ID:', FEISHU_TABLE_ID);
  console.log('');
  
  // 1. 获取令牌
  console.log('📝 获取访问令牌...');
  const token = await getTenantAccessToken();
  console.log('✅ 令牌获取成功\n');
  
  // 2. 获取字段信息
  console.log('📊 获取表格字段...');
  const fields = await getTableFields(token);
  console.log('字段信息:', JSON.stringify(fields, null, 2));
  console.log('');
  
  // 3. 获取记录
  console.log('📥 获取表格记录...');
  const records = await getTableRecords(token);
  console.log('记录数据:', JSON.stringify(records, null, 2));
  
  console.log('\n✨ 完成！');
}

main().catch(console.error);
