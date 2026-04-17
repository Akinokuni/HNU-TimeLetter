import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import OSS from 'ali-oss';
import type { CreationIdea, LocationPoint, Story } from './types';
import locationsConfig from '../config/locations.json';

// Ensure env is loaded
config({ path: path.resolve(process.cwd(), '.env.local') });

type LocationCoords = Record<string, { name: string; x: number; y: number }>;

type FeishuAttachment = {
  file_token?: string;
  token?: string;
  name?: string;
};

type FeishuRecord = {
  record_id: string;
  fields: Record<string, unknown>;
};

type SyncConfig = {
  feishuAppId?: string;
  feishuAppSecret?: string;
  feishuAppToken?: string;
  feishuTableId?: string;
  feishuViewId?: string;
  feishuCreationTableId?: string;
  feishuCreationViewId?: string;
  feishuOssTableId: string;
  feishuLocationsTableId: string;
  ossRegion?: string;
  ossBucket?: string;
  ossAccessKeyId?: string;
  ossAccessKeySecret?: string;
};

const syncConfig: SyncConfig = {
  feishuAppId: process.env.FEISHU_APP_ID,
  feishuAppSecret: process.env.FEISHU_APP_SECRET,
  feishuAppToken: process.env.FEISHU_APP_TOKEN,
  feishuTableId: process.env.FEISHU_TABLE_ID,
  feishuViewId: process.env.FEISHU_VIEW_ID,
  feishuCreationTableId: process.env.FEISHU_CREATION_TABLE_ID || 'tblKNYCf641UMSUe',
  feishuCreationViewId: process.env.FEISHU_CREATION_VIEW_ID || 'vewbLA6eBY',
  feishuOssTableId: 'tblwLUNdWNzv1kZw',
  feishuLocationsTableId: 'tblaMWD1PV9lwXDr',
  ossRegion: process.env.ALIYUN_OSS_REGION,
  ossBucket: process.env.ALIYUN_OSS_BUCKET,
  ossAccessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  ossAccessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
};

let locationCoords: LocationCoords = locationsConfig as LocationCoords;

/** ------------------------- 通用工具层 ------------------------- */
const getText = (field: unknown): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;

  if (Array.isArray(field) && field.length > 0) {
    return field
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('');
  }

  if (typeof field === 'object' && field !== null && 'text' in field) {
    const text = (field as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }

  return String(field);
};

const getPersonName = (field: unknown): string => {
  if (!Array.isArray(field) || field.length === 0) return '';
  const first = field[0];
  if (!first || typeof first !== 'object' || !('name' in first)) return '';
  const name = (first as { name?: unknown }).name;
  return typeof name === 'string' ? name : '';
};

const getAttachments = (field: unknown): FeishuAttachment[] => {
  if (!Array.isArray(field)) return [];

  return field.filter((item): item is FeishuAttachment => {
    return Boolean(item && typeof item === 'object' && ('file_token' in item || 'token' in item));
  });
};

const formatDateTime = (value: unknown): string => {
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && /^\d+$/.test(value.trim())) {
      return new Date(asNumber).toISOString();
    }
    return value;
  }

  return '';
};

const mergeTextWithUrls = (text: string, urls: string[]): string => {
  if (urls.length === 0) return text;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  urls.forEach((url) => {
    if (!lines.includes(url)) {
      lines.push(url);
    }
  });

  return lines.join('\n');
};

const extractUrlsFromText = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/https?:\/\/\S+/g);
  return matches ? [...new Set(matches)] : [];
};

const fileWriter = {
  writeLocationConfig(data: LocationCoords): void {
    const outputPath = path.resolve(process.cwd(), 'src/config/locations.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 地点数据已更新至: ${outputPath}`);
  },

  writeContent(data: LocationPoint[]): void {
    const outputPath = path.resolve(process.cwd(), 'src/data/content.json');
    const content = JSON.stringify({ locations: data }, null, 2);

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`\n✅ 数据已写入: ${outputPath}`);
    console.log(`📊 共 ${data.length} 个地点，${data.reduce((sum, loc) => sum + loc.stories.length, 0)} 个故事`);
  },

  writeCreationBoard(data: CreationIdea[]): void {
    const outputPath = path.resolve(process.cwd(), 'src/data/creation-board.json');
    const content = JSON.stringify({ ideas: data }, null, 2);

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ 创作公示板数据已写入: ${outputPath}`);
    console.log(`📌 共 ${data.length} 条创作记录`);
  },
};

/** ------------------------- 基础设施层：OSS ------------------------- */
const ossService = (() => {
  if (!syncConfig.ossRegion || !syncConfig.ossBucket || !syncConfig.ossAccessKeyId || !syncConfig.ossAccessKeySecret) {
    return {
      client: null as OSS | null,
      async upload(): Promise<{ url: string; path: string; hash: string }> {
        throw new Error('OSS 客户端未初始化');
      },
    };
  }

  const client = new OSS({
    region: syncConfig.ossRegion,
    accessKeyId: syncConfig.ossAccessKeyId,
    accessKeySecret: syncConfig.ossAccessKeySecret,
    bucket: syncConfig.ossBucket,
  });
  console.log('✅ OSS 客户端初始化成功');

  return {
    client,
    async upload(buffer: Buffer, fileName: string): Promise<{ url: string; path: string; hash: string }> {
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      const ext = path.extname(fileName) || '.jpg';
      const ossPath = `hnu-timeletter/${hash}${ext}`;

      try {
        try {
          await client.head(ossPath);
          console.log(`  ⏭️  文件已存在，跳过上传: ${ossPath}`);
        } catch (error: unknown) {
          if (error instanceof Error && 'code' in error && error.code === 'NoSuchKey') {
            await client.put(ossPath, buffer);
            console.log(`  ✅ 上传成功: ${ossPath}`);
          } else {
            throw error;
          }
        }

        const url = `https://${syncConfig.ossBucket}.${syncConfig.ossRegion}.aliyuncs.com/${ossPath}`;
        return { url, path: ossPath, hash };
      } catch (error) {
        console.error('  ❌ OSS 上传失败:', error);
        throw error;
      }
    },
  };
})();

/** ------------------------- 基础设施层：飞书客户端 ------------------------- */
const feishuClient = {
  async getTenantAccessToken(): Promise<string> {
    if (!syncConfig.feishuAppId || !syncConfig.feishuAppSecret) {
      throw new Error('缺少飞书凭证，请检查 .env.local 文件');
    }

    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        app_id: syncConfig.feishuAppId,
        app_secret: syncConfig.feishuAppSecret,
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`获取飞书令牌失败: ${data.msg}`);
    }

    return data.tenant_access_token as string;
  },

  async downloadAttachment(token: string, fileToken: string): Promise<Buffer> {
    const url = `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`下载附件失败: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },

  async recordOssFile(
    token: string,
    payload: {
      fileName: string;
      ossPath: string;
      ossUrl: string;
      hash: string;
      fileSize: number;
      usage: string;
      recordId: string;
    }
  ): Promise<void> {
    if (!syncConfig.feishuAppToken) {
      console.warn('⚠️ 缺少 FEISHU_APP_TOKEN，跳过 OSS 文件记录');
      return;
    }

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${syncConfig.feishuAppToken}/tables/${syncConfig.feishuOssTableId}/records`;

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    };

    const fields = {
      文本: `${payload.fileName} - ${payload.usage}`,
      文件名: payload.fileName,
      OSS路径: payload.ossPath,
      OSS_URL: {
        link: payload.ossUrl,
        text: payload.ossUrl,
      },
      MD5哈希: payload.hash,
      文件大小: formatSize(payload.fileSize),
      上传时间: Date.now(),
      用途: payload.usage,
      关联记录ID: payload.recordId,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ fields }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        console.error(`  ⚠️  记录 OSS 文件信息失败: ${data.msg}`);
      } else {
        console.log('  📝 已记录到 OSS 文件表');
      }
    } catch (error) {
      console.error('  ⚠️  记录 OSS 文件信息异常:', error);
    }
  },

  async updateRecordFields(
    token: string,
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ): Promise<void> {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ fields }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      console.error(`  ⚠️  更新记录失败: ${data.msg}`);
    } else {
      console.log('  ✅ 已回写字段到飞书');
    }
  },

  async updateStoryRecordOssUrl(token: string, recordId: string, avatarOssUrl: string, mainImageOssUrl: string): Promise<void> {
    if (!syncConfig.feishuAppToken || !syncConfig.feishuTableId) return;

    const fields: Record<string, string> = {};
    if (avatarOssUrl) fields['头像OSS_URL'] = avatarOssUrl;
    if (mainImageOssUrl) fields['大图OSS_URL'] = mainImageOssUrl;
    if (Object.keys(fields).length === 0) return;

    await this.updateRecordFields(token, syncConfig.feishuAppToken, syncConfig.feishuTableId, recordId, fields);
  },

  async fetchStoryRecords(token: string): Promise<FeishuRecord[]> {
    if (!syncConfig.feishuAppToken || !syncConfig.feishuTableId) {
      throw new Error('缺少飞书表格配置');
    }

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${syncConfig.feishuAppToken}/tables/${syncConfig.feishuTableId}/records/search`;
    const allItems: FeishuRecord[] = [];
    let hasMore = true;
    let pageToken = '';

    while (hasMore) {
      const body: Record<string, unknown> = {
        page_size: 500,
      };

      if (syncConfig.feishuViewId) {
        body.view_id = syncConfig.feishuViewId;
      }
      if (pageToken) {
        body.page_token = pageToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(`拉取飞书数据失败: ${data.msg} (code: ${data.code})`);
      }

      allItems.push(...((data.data.items || []) as FeishuRecord[]));
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token || '';
    }

    return allItems;
  },

  async fetchCreationRecords(token: string): Promise<FeishuRecord[]> {
    if (!syncConfig.feishuAppToken || !syncConfig.feishuCreationTableId) {
      throw new Error('缺少创作公示板表格配置');
    }

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${syncConfig.feishuAppToken}/tables/${syncConfig.feishuCreationTableId}/records/search`;
    const allItems: FeishuRecord[] = [];
    let hasMore = true;
    let pageToken = '';

    while (hasMore) {
      const body: Record<string, unknown> = {
        page_size: 500,
      };

      if (syncConfig.feishuCreationViewId) {
        body.view_id = syncConfig.feishuCreationViewId;
      }

      if (pageToken) {
        body.page_token = pageToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(`拉取创作公示板数据失败: ${data.msg} (code: ${data.code})`);
      }

      allItems.push(...((data.data.items || []) as FeishuRecord[]));
      hasMore = data.data.has_more || false;
      pageToken = data.data.page_token || '';
    }

    return allItems;
  },

  async fetchLocations(token: string): Promise<LocationCoords> {
    if (!syncConfig.feishuAppToken || !syncConfig.feishuLocationsTableId) {
      console.warn('⚠️ 缺少飞书地点表配置，跳过地点同步');
      return locationsConfig as LocationCoords;
    }

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${syncConfig.feishuAppToken}/tables/${syncConfig.feishuLocationsTableId}/records?page_size=100`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.code !== 0) {
        console.error(`⚠️ 拉取地点数据失败: ${data.msg}`);
        return locationsConfig as LocationCoords;
      }

      const newLocations: LocationCoords = {};
      if (data.data.items) {
        console.log(`🔍 飞书返回了 ${data.data.items.length} 条地点记录`);
        (data.data.items as FeishuRecord[]).forEach((item) => {
          const fields = item.fields;
          const id = getText(fields['地点ID']);
          console.log(`  - 记录ID: ${item.record_id}, 地点ID: ${id}, 名称: ${fields['地点名称']}`);

          if (!id) {
            console.warn(`  ⚠️ 记录 ${item.record_id} 缺少 '地点ID' 字段`);
            return;
          }

          newLocations[id] = {
            name: getText(fields['地点名称']),
            x: Number(fields['坐标X(%)']) || 0,
            y: Number(fields['坐标Y(%)']) || 0,
          };
        });
      }

      fileWriter.writeLocationConfig(newLocations);
      return newLocations;
    } catch (error) {
      console.error('⚠️ 同步地点数据异常:', error);
      return locationsConfig as LocationCoords;
    }
  },
};

/** ------------------------- 应用层：数据转换 ------------------------- */
async function processAttachments(
  token: string,
  attachmentField: unknown,
  usage: string,
  recordId: string
): Promise<{ urls: string[]; names: string[] }> {
  if (!ossService.client) {
    return { urls: [], names: [] };
  }

  const attachments = getAttachments(attachmentField);
  if (attachments.length === 0) {
    return { urls: [], names: [] };
  }

  const urls: string[] = [];
  const names: string[] = [];

  for (const attachment of attachments) {
    const fileToken = attachment.file_token || attachment.token;
    const fileName = attachment.name || 'image.jpg';
    if (!fileToken) continue;

    try {
      const buffer = await feishuClient.downloadAttachment(token, fileToken);
      const { url, path: ossPath, hash } = await ossService.upload(buffer, fileName);

      await feishuClient.recordOssFile(token, {
        fileName,
        ossPath,
        ossUrl: url,
        hash,
        fileSize: buffer.length,
        usage,
        recordId,
      });

      urls.push(url);
      names.push(fileName);
    } catch (error) {
      console.error('  ⚠️ 处理附件失败:', error);
    }
  }

  return { urls, names };
}

const dataTransformer = {
  async transformRecords(token: string, feishuRecords: FeishuRecord[], coords: LocationCoords): Promise<LocationPoint[]> {
    const storiesMap = new Map<string, Story[]>();
    const BATCH_SIZE = 5;

    for (let i = 0; i < feishuRecords.length; i += BATCH_SIZE) {
      const batch = feishuRecords.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (record) => {
          const fields = record.fields;
          if (!fields['角色ID'] || !fields['故事内容']) return;

          console.log(`\n📝 处理记录: ${getText(fields['角色名'])} - ${record.record_id}`);

          let avatarUrl = getText(fields['头像OSS_URL']);
          let mainImageUrl = getText(fields['大图OSS_URL']);
          let hasNewUpload = false;

          if (ossService.client) {
            if (!avatarUrl && fields['头像']) {
              console.log('  📥 处理头像附件...');
              const { urls } = await processAttachments(token, fields['头像'], '头像', record.record_id);
              const newUrl = urls[0] || '';
              if (newUrl) {
                avatarUrl = newUrl;
                hasNewUpload = true;
              }
            }

            if (!mainImageUrl && fields['大图']) {
              console.log('  📥 处理大图附件...');
              const { urls } = await processAttachments(token, fields['大图'], '大图', record.record_id);
              const newUrl = urls[0] || '';
              if (newUrl) {
                mainImageUrl = newUrl;
                hasNewUpload = true;
              }
            }

            if (hasNewUpload) {
              await feishuClient.updateStoryRecordOssUrl(token, record.record_id, avatarUrl, mainImageUrl);
            }
          } else {
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

          if (!storiesMap.has(story.locationId)) {
            storiesMap.set(story.locationId, []);
          }
          storiesMap.get(story.locationId)!.push(story);
        })
      );
    }

    const locations: LocationPoint[] = [];
    const allLocationIds = new Set([...Object.keys(coords), ...storiesMap.keys()]);

    allLocationIds.forEach((locationId) => {
      const stories = storiesMap.get(locationId) || [];
      let current = coords[locationId];

      if (!current) {
        console.warn(`⚠️ 警告: 地点ID '${locationId}' 未在配置中找到，将使用默认坐标 (50, 50)`);
        current = {
          name: stories[0]?.locationId || locationId,
          x: 50,
          y: 50,
        };
      }

      locations.push({
        id: locationId,
        name: current.name,
        x: current.x,
        y: current.y,
        stories,
      });
    });

    return locations;
  },

  async transformCreationRecords(token: string, feishuRecords: FeishuRecord[]): Promise<CreationIdea[]> {
    const contentTypeFieldName = '请选择你要添加的内容（该表可重复提交，如需填写多项，请再次提交）';
    const BATCH_SIZE = 5;
    const ideas: CreationIdea[] = [];

    for (let i = 0; i < feishuRecords.length; i += BATCH_SIZE) {
      const batch = feishuRecords.slice(i, i + BATCH_SIZE);

      const processedBatch = await Promise.all(
        batch.map(async (record) => {
          const fields = record.fields;
          const cardId = getText(fields['CardID']) || getText(fields['自动编号']) || record.record_id;
          const contentType = getText(fields[contentTypeFieldName]);
          const submitter = getPersonName(fields['提交人']);
          const author = getText(fields['你的昵称']) || submitter;
          const existingText = getText(fields['文本']).trim();
          const attachments = getAttachments(fields['请上传你的图片']);

          console.log(`\n📌 处理创作记录: ${cardId} (${contentType || '未分类'})`);

          let imageUrls = extractUrlsFromText(existingText);

          if (attachments.length > 0 && imageUrls.length < attachments.length) {
            console.log('  📥 处理参考图附件...');
            const result = await processAttachments(token, fields['请上传你的图片'], '创作公示板参考图', record.record_id);
            imageUrls = [...new Set([...imageUrls, ...result.urls])];
          }

          const mergedText = mergeTextWithUrls(existingText, imageUrls);
          if (
            mergedText !== existingText &&
            syncConfig.feishuAppToken &&
            syncConfig.feishuCreationTableId
          ) {
            console.log('  📝 回填参考图 OSS 链接到文本字段...');
            await feishuClient.updateRecordFields(
              token,
              syncConfig.feishuAppToken,
              syncConfig.feishuCreationTableId,
              record.record_id,
              { 文本: mergedText }
            );
          }

          return {
            id: record.record_id,
            cardId,
            content: mergedText || existingText,
            author,
            submitter,
            images: imageUrls,
            createdAt: formatDateTime(fields['提交时间']),
            tags: contentType,
          } satisfies CreationIdea;
        })
      );

      ideas.push(...processedBatch);
    }

    ideas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ideas;
  },
};

/** ------------------------- 主流程 ------------------------- */
export async function syncFeishuData(): Promise<{
  success: boolean;
  message: string;
  data?: { locationCount: number; storyCount: number; creationIdeaCount: number };
}> {
  try {
    console.log('🚀 开始同步飞书数据...\n');

    console.log('🔑 获取访问令牌...');
    const token = await feishuClient.getTenantAccessToken();
    console.log('✅ 令牌获取成功\n');

    console.log('📍 同步地点配置...');
    locationCoords = await feishuClient.fetchLocations(token);
    console.log(`✅ 加载了 ${Object.keys(locationCoords).length} 个地点配置\n`);

    console.log('📥 拉取故事记录...');
    const feishuRecords = await feishuClient.fetchStoryRecords(token);
    console.log(`✅ 成功拉取 ${feishuRecords.length} 条故事记录\n`);

    console.log('📥 拉取创作公示板记录...');
    const creationRecords = await feishuClient.fetchCreationRecords(token);
    console.log(`✅ 成功拉取 ${creationRecords.length} 条创作记录\n`);

    console.log('🔄 转换故事数据并处理图片...');
    const locations = await dataTransformer.transformRecords(token, feishuRecords, locationCoords);
    console.log('\n✅ 故事数据转换完成\n');

    console.log('🔄 转换创作公示板数据并处理参考图...');
    const creationIdeas = await dataTransformer.transformCreationRecords(token, creationRecords);
    console.log('\n✅ 创作公示板转换完成\n');

    console.log('💾 写入本地文件...');
    fileWriter.writeContent(locations);
    fileWriter.writeCreationBoard(creationIdeas);

    const storyCount = locations.reduce((sum, loc) => sum + loc.stories.length, 0);
    const locationCount = locations.length;
    const creationIdeaCount = creationIdeas.length;
    console.log('\n✨ 同步完成！');

    return {
      success: true,
      message: '同步完成',
      data: { locationCount, storyCount, creationIdeaCount },
    };
  } catch (error) {
    console.error('\n❌ 同步失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `同步失败: ${errorMessage}`,
    };
  }
}
