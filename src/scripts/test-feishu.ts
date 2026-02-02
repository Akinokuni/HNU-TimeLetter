/**
 * 飞书 API 测试脚本
 * 用于探索表格结构
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

// 环境变量
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;

const FEISHU_AUTH_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/';

/**
 * 获取飞书访问令牌
 */
async function getTenantAccessToken(): Promise<string> {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('缺少飞书凭证');
  }

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

  const text = await response.text();
  console.log('原始响应:', text);
  
  const data = JSON.parse(text);
  console.log('认证响应:', JSON.stringify(data, null, 2));
  
  if (data.code !== 0) {
    throw new Error(`获取飞书令牌失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 获取多维表格的所有表
 */
async function listTables(token: string, appToken: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  console.log('原始响应:', text);
  
  const data = JSON.parse(text);
  console.log('\n表格列表:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * 获取表格字段信息
 */
async function getTableFields(token: string, appToken: string, tableId: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('\n字段信息:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * 获取表格记录
 */
async function getTableRecords(token: string, appToken: string, tableId: string) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=10`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('\n记录数据:', JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  try {
    console.log('🔍 开始探索飞书表格结构...\n');
    
    // 调试：打印环境变量
    console.log('环境变量检查:');
    console.log('FEISHU_APP_ID:', FEISHU_APP_ID ? '已设置' : '未设置');
    console.log('FEISHU_APP_SECRET:', FEISHU_APP_SECRET ? '已设置' : '未设置');
    console.log('FEISHU_TABLE_ID:', FEISHU_TABLE_ID ? '已设置' : '未设置');
    console.log('');
    
    // 1. 获取访问令牌
    console.log('📝 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('✅ 令牌获取成功');
    
    // 注意: FEISHU_TABLE_ID 实际上是 app_token
    // 需要先获取这个 app 下的所有表
    console.log('\n📋 获取多维表格的所有表...');
    const tables = await listTables(token, FEISHU_TABLE_ID!);
    
    if (tables.data && tables.data.items && tables.data.items.length > 0) {
      const firstTable = tables.data.items[0];
      console.log(`\n✅ 找到表格: ${firstTable.name} (ID: ${firstTable.table_id})`);
      
      // 2. 获取字段信息
      console.log('\n📊 获取字段信息...');
      await getTableFields(token, FEISHU_TABLE_ID!, firstTable.table_id);
      
      // 3. 获取记录
      console.log('\n📥 获取记录数据...');
      await getTableRecords(token, FEISHU_TABLE_ID!, firstTable.table_id);
    }
    
    console.log('\n✨ 探索完成！');
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

main();
