/**
 * 测试从知识库中读取多维表格
 * 知识库中的表格可能需要不同的 API
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const WIKI_ID = 'ScDawoedLivEd0kvLKjcaYIjn98'; // 从 URL 提取
const TABLE_ID = 'tblWufNIW5TtO3Am';

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
  console.log('🔍 尝试不同的方式访问知识库中的表格...\n');
  
  const token = await getTenantAccessToken();
  console.log('✅ 令牌获取成功\n');
  
  // 方法 1: 尝试使用 Wiki ID 作为 app_token
  console.log('方法 1: 使用 Wiki ID 作为 app_token');
  const url1 = `https://open.feishu.cn/open-apis/bitable/v1/apps/${WIKI_ID}/tables/${TABLE_ID}/records?page_size=5`;
  console.log('URL:', url1);
  
  const response1 = await fetch(url1, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data1 = await response1.json();
  console.log('响应:', JSON.stringify(data1, null, 2));
  console.log('');
  
  // 方法 2: 尝试获取知识库信息
  console.log('方法 2: 获取知识库信息');
  const url2 = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${WIKI_ID}`;
  console.log('URL:', url2);
  
  const response2 = await fetch(url2, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data2 = await response2.json();
  console.log('响应:', JSON.stringify(data2, null, 2));
}

main().catch(console.error);
