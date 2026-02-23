/**
 * 飞书数据同步脚本
 * 功能: 从飞书多维表格拉取数据并生成本地 JSON 文件
 * 
 * 使用方法:
 * 1. 配置 .env.local 中的飞书凭证
 * 2. 运行: npm run sync
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import OSS from 'ali-oss';
import type { LocationPoint, Story } from '../lib/types';

// 读取本地地点配置文件
import locationsConfig from '../config/locations.json';

config({ path: '.env.local' });

// 环境变量
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;
const FEISHU_VIEW_ID = process.env.FEISHU_VIEW_ID;
const FEISHU_OSS_TABLE_ID = 'tblwLUNdWNzv1kZw'; // OSS 文件记录表
const FEISHU_LOCATIONS_TABLE_ID = 'tblaMWD1PV9lwXDr'; // 地点坐标表

// 阿里云 OSS 配置
const OSS_REGION = process.env.ALIYUN_OSS_REGION;
const OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET;
const OSS_ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
const OSS_ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

// 地点坐标配置（从配置文件读取，后续会被飞书数据覆盖）
let LOCATION_COORDS: Record<string, { name: string; x: number; y: number }> = locationsConfig;

// 初始化 OSS 客户端
let ossClient: OSS | null = null;
if (OSS_REGION && OSS_BUCKET && OSS_ACCESS_KEY_ID && OSS_ACCESS_KEY_SECRET) {
  ossClient = new OSS({
    region: OSS_REGION,
    accessKeyId: OSS_ACCESS_KEY_ID,
    accessKeySecret: OSS_ACCESS_KEY_SECRET,
    bucket: OSS_BUCKET,
  });
  console.log('✅ OSS 客户端初始化成功');
}

/**
 * 获取飞书访问令牌
 */
async function getTenantAccessToken(): Promise<string> {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('缺少飞书凭证，请检查 .env.local 文件');
  }

  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`获取飞书令牌失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 下载飞书附件到内存
 */
async function downloadFeishuAttachment(token: string, fileToken: string): Promise<Buffer> {
  const url = `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`下载附件失败: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 上传文件到 OSS
 */
async function uploadToOSS(buffer: Buffer, fileName: string): Promise<{ url: string; path: string; hash: string }> {
  if (!ossClient) {
    throw new Error('OSS 客户端未初始化');
  }

  // 生成唯一文件名（使用 MD5 避免重复上传）
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  const ext = path.extname(fileName) || '.jpg';
  const ossPath = `hnu-timeletter/${hash}${ext}`;

  try {
    // 检查文件是否已存在
    try {
      await ossClient.head(ossPath);
      console.log(`  ⏭️  文件已存在，跳过上传: ${ossPath}`);
    } catch (error: any) {
      // 文件不存在，执行上传
      if (error.code === 'NoSuchKey') {
        await ossClient.put(ossPath, buffer);
        console.log(`  ✅ 上传成功: ${ossPath}`);
      } else {
        throw error;
      }
    }

    // 返回公网访问 URL 和相关信息
    const url = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossPath}`;
    return { url, path: ossPath, hash };
  } catch (error) {
    console.error(`  ❌ OSS 上传失败:`, error);
    throw error;
  }
}

/**
 * 记录 OSS 文件信息到飞书表格
 */
async function recordOSSFile(
  token: string,
  fileName: string,
  ossPath: string,
  ossUrl: string,
  hash: string,
  fileSize: number,
  usage: string,
  recordId: string
): Promise<void> {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_OSS_TABLE_ID}/records`;
  
  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();

  const fields = {
    '文本': `${fileName} - ${usage}`,
    '文件名': fileName,
    'OSS路径': ossPath,
    'OSS_URL': {
      link: ossUrl,
      text: ossUrl
    },
    'MD5哈希': hash,
    '文件大小': formatSize(fileSize),
    '上传时间': timestamp,
    '用途': usage,
    '关联记录ID': recordId
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ fields }),
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      console.error(`  ⚠️  记录 OSS 文件信息失败: ${data.msg}`);
    } else {
      console.log(`  📝 已记录到 OSS 文件表`);
    }
  } catch (error) {
    console.error(`  ⚠️  记录 OSS 文件信息异常:`, error);
  }
}

/**
 * 处理飞书附件字段，下载并上传到 OSS
 */
async function processAttachment(
  token: string,
  attachmentField: any,
  usage: string,
  recordId: string
): Promise<string> {
  if (!attachmentField || !Array.isArray(attachmentField) || attachmentField.length === 0) {
    return '';
  }

  const firstAttachment = attachmentField[0];
  const fileToken = firstAttachment.file_token || firstAttachment.token;
  const fileName = firstAttachment.name || 'image.jpg';
  
  if (!fileToken) {
    return '';
  }

  try {
    // 下载附件
    const buffer = await downloadFeishuAttachment(token, fileToken);
    
    // 上传到 OSS
    const { url, path: ossPath, hash } = await uploadToOSS(buffer, fileName);
    
    // 记录到 OSS 文件表
    await recordOSSFile(token, fileName, ossPath, url, hash, buffer.length, usage, recordId);
    
    return url;
  } catch (error) {
    console.error(`  ⚠️  处理附件失败:`, error);
    return '';
  }
}

/**
 * 更新飞书记录的 OSS URL 字段
 */
async function updateRecordOSSUrl(
  token: string,
  recordId: string,
  avatarOssUrl: string,
  mainImageOssUrl: string
): Promise<void> {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/${recordId}`;
  
  const fields: Record<string, string> = {};
  if (avatarOssUrl) fields['头像OSS_URL'] = avatarOssUrl;
  if (mainImageOssUrl) fields['大图OSS_URL'] = mainImageOssUrl;

  if (Object.keys(fields).length === 0) {
    return;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ fields }),
  });

  const data = await response.json();
  
  if (data.code !== 0) {
    console.error(`  ⚠️  更新记录失败: ${data.msg}`);
  } else {
    console.log(`  ✅ 已回写 OSS URL 到飞书`);
  }
}

/**
 * 从飞书拉取记录（使用搜索接口）
 */
async function fetchFeishuRecords(token: string): Promise<any[]> {
  if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
    throw new Error('缺少飞书表格配置');
  }

  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/search`;

  let allItems: any[] = [];
  let hasMore = true;
  let pageToken = '';

  while (hasMore) {
    const body: any = {
      page_size: 500,
    };

    // 如果指定了视图，只拉取该视图的数据
    if (FEISHU_VIEW_ID) {
      body.view_id = FEISHU_VIEW_ID;
    }

    // 添加过滤条件：只拉取状态为"已发布"的记录
    body.filter = {
      conjunction: 'and',
      conditions: [
        {
          field_name: '状态',
          operator: 'is',
          value: ['已发布']
        }
      ]
    };

    if (pageToken) {
      body.page_token = pageToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`拉取飞书数据失败: ${data.msg} (code: ${data.code})`);
    }

    allItems.push(...(data.data.items || []));
    hasMore = data.data.has_more || false;
    pageToken = data.data.page_token || '';
  }

  return allItems;
}

/**
 * 拉取飞书地点数据并更新本地配置文件
 */
async function fetchLocations(token: string): Promise<Record<string, { name: string; x: number; y: number }>> {
  if (!FEISHU_APP_TOKEN || !FEISHU_LOCATIONS_TABLE_ID) {
    console.warn('⚠️ 缺少飞书地点表配置，跳过地点同步');
    return locationsConfig;
  }

  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_LOCATIONS_TABLE_ID}/records?page_size=100`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      console.error(`⚠️ 拉取地点数据失败: ${data.msg}`);
      return locationsConfig;
    }

    const newLocations: Record<string, { name: string; x: number; y: number }> = {};
    
    if (data.data.items) {
      console.log(`🔍 飞书返回了 ${data.data.items.length} 条地点记录`);
      data.data.items.forEach((item: any) => {
        const fields = item.fields;
        const id = fields['地点ID'];
        console.log(`  - 记录ID: ${item.record_id}, 地点ID: ${id}, 名称: ${fields['地点名称']}`);
        
        if (id) {
          newLocations[id] = {
            name: fields['地点名称'] || '',
            x: Number(fields['坐标X(%)']) || 0,
            y: Number(fields['坐标Y(%)']) || 0,
          };
        } else {
            console.warn(`  ⚠️ 记录 ${item.record_id} 缺少 '地点ID' 字段`);
        }
      });
    }

    // 写入本地配置文件
    const outputPath = path.join(__dirname, '../config/locations.json');
    fs.writeFileSync(outputPath, JSON.stringify(newLocations, null, 2), 'utf-8');
    console.log(`✅ 地点数据已更新至: ${outputPath}`);
    
    return newLocations;
  } catch (error) {
    console.error('⚠️ 同步地点数据异常:', error);
    return locationsConfig;
  }
}

// 辅助函数：从飞书字段提取文本
const getText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return field.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && item.text) return item.text;
      return '';
    }).join('');
  }
  if (typeof field === 'object' && field.text) return field.text;
  return String(field);
};

/**
 * 转换飞书数据为本地格式
 */
async function transformData(token: string, feishuRecords: any[]): Promise<LocationPoint[]> {
  const storiesMap = new Map<string, Story[]>();
  
  // 并发控制：每次处理 5 条记录，避免触发限流
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < feishuRecords.length; i += BATCH_SIZE) {
    const batch = feishuRecords.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (record) => {
      const fields = record.fields;
      
      // 跳过空记录或未发布的记录
      if (!fields['角色ID'] || !fields['故事内容']) {
        return;
      }

      console.log(`\n📝 处理记录: ${getText(fields['角色名'])} - ${record.record_id}`);

      // 处理图片附件
      let avatarUrl = getText(fields['头像OSS_URL']);
      let mainImageUrl = getText(fields['大图OSS_URL']);
      let hasNewUpload = false; // 标记是否有新上传

      // 如果 OSS URL 不存在，则从附件字段下载并上传
      if (ossClient) {
        if (!avatarUrl && fields['头像']) {
          console.log('  📥 处理头像附件...');
          const newUrl = await processAttachment(token, fields['头像'], '头像', record.record_id);
          if (newUrl) {
            avatarUrl = newUrl;
            hasNewUpload = true;
          }
        }

        if (!mainImageUrl && fields['大图']) {
          console.log('  📥 处理大图附件...');
          const newUrl = await processAttachment(token, fields['大图'], '大图', record.record_id);
          if (newUrl) {
            mainImageUrl = newUrl;
            hasNewUpload = true;
          }
        }

        // 仅在有新上传时回写 OSS URL 到飞书
        if (hasNewUpload) {
          await updateRecordOSSUrl(token, record.record_id, avatarUrl, mainImageUrl);
        }
      } else {
        // 如果没有配置 OSS，使用原始 URL 字段
        if (!avatarUrl) avatarUrl = getText(fields['头像URL']);
        if (!mainImageUrl) mainImageUrl = getText(fields['大图URL']);
      }

      const story: Story = {
        id: record.record_id,
        characterId: getText(fields['角色ID']),
        characterName: getText(fields['角色名']),
        avatarUrl,
        mainImageUrl,
        content: getText(fields['故事内容']),
        author: getText(fields['投稿人']),
        date: getText(fields['日期']),
        locationId: getText(fields['地点ID']),
      };
      
      const locationId = story.locationId;
      if (!storiesMap.has(locationId)) {
        storiesMap.set(locationId, []);
      }
      storiesMap.get(locationId)!.push(story);
    }));
  }
  
  // 聚合为地点数据
  const locations: LocationPoint[] = [];
  
  // 获取所有涉及的地点 ID（包括配置中的和故事中引用的）
  const allLocationIds = new Set([
    ...Object.keys(LOCATION_COORDS),
    ...storiesMap.keys()
  ]);

  allLocationIds.forEach((locationId) => {
    const stories = storiesMap.get(locationId) || [];
    let coords = LOCATION_COORDS[locationId];

    if (!coords) {
        console.warn(`⚠️ 警告: 地点ID '${locationId}' 未在配置中找到，将使用默认坐标 (50, 50)`);
        coords = {
            name: stories[0]?.locationId || locationId,
            x: 50,
            y: 50,
        };
    }

    locations.push({
      id: locationId,
      name: coords.name,
      x: coords.x,
      y: coords.y,
      stories,
    });
  });
  
  return locations;
}

/**
 * 写入本地 JSON 文件
 */
function writeToFile(data: LocationPoint[]): void {
  const outputPath = path.join(__dirname, '../data/content.json');
  const content = JSON.stringify({ locations: data }, null, 2);
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n✅ 数据已写入: ${outputPath}`);
  console.log(`📊 共 ${data.length} 个地点，${data.reduce((sum, loc) => sum + loc.stories.length, 0)} 个故事`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始同步飞书数据...\n');
    
    // 1. 获取访问令牌
    console.log('🔑 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('✅ 令牌获取成功\n');

    // 2. 同步地点数据
    console.log('📍 同步地点配置...');
    LOCATION_COORDS = await fetchLocations(token);
    console.log(`✅ 加载了 ${Object.keys(LOCATION_COORDS).length} 个地点配置\n`);

    // 3. 拉取数据
    console.log('📥 拉取飞书记录...');
    const feishuRecords = await fetchFeishuRecords(token);
    console.log(`✅ 成功拉取 ${feishuRecords.length} 条记录\n`);
    
    // 3. 转换数据（包含图片处理）
    console.log('🔄 转换数据格式并处理图片...');
    const locations = await transformData(token, feishuRecords);
    console.log(`\n✅ 转换完成\n`);
    
    // 4. 写入文件
    console.log('💾 写入本地文件...');
    writeToFile(locations);
    
    console.log('\n✨ 同步完成！');
  } catch (error) {
    console.error('\n❌ 同步失败:', error);
    process.exit(1);
  }
}

// 执行
main();
