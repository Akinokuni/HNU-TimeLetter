import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { LocationPoint, Story } from '@/lib/types';
import { DEFAULT_AVATAR_URL, DEFAULT_SCENE_URL } from '@/lib/content';
import defaultLocationConfig from '@/config/locations.json';
import { FeishuClient } from './client';
import { OssService } from './oss';
import { getNumber, getText } from './text';
import type {
  FeishuConnectionSettings,
  FeishuRecord,
  LocationCoords,
} from './types';

type FeishuAttachment = {
  file_token?: string;
  token?: string;
  name?: string;
};

async function readWorkspaceJson<T>(workspaceRoot: string, relativePath: string, fallback: T): Promise<T> {
  try {
    const fullPath = path.join(workspaceRoot, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeWorkspaceJson(
  workspaceRoot: string,
  relativePath: string,
  data: unknown
): Promise<void> {
  const fullPath = path.join(workspaceRoot, relativePath);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function recordOssFile(
  client: FeishuClient,
  settings: FeishuConnectionSettings,
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
  if (!settings.feishuOssTableId) return;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  try {
    await client.createRecord(settings.feishuOssTableId, {
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
    });
  } catch (error) {
    console.warn('记录 OSS 文件表失败，已跳过：', error);
  }
}

async function updateStoryImageUrls(
  client: FeishuClient,
  tableId: string,
  recordId: string,
  avatarUrl: string,
  mainImageUrl: string
): Promise<void> {
  const fields: Record<string, string> = {};
  if (avatarUrl) fields['头像OSS_URL'] = avatarUrl;
  if (mainImageUrl) fields['大图OSS_URL'] = mainImageUrl;
  if (Object.keys(fields).length === 0) return;
  await client.updateRecord(tableId, recordId, fields);
}

async function processAttachment(
  client: FeishuClient,
  ossService: OssService,
  settings: FeishuConnectionSettings,
  attachmentField: unknown,
  usage: string,
  recordId: string
): Promise<string> {
  if (!ossService.isConfigured || !Array.isArray(attachmentField) || attachmentField.length === 0) {
    return '';
  }

  const attachment = attachmentField[0] as FeishuAttachment;
  const fileToken = attachment.file_token || attachment.token;
  const fileName = attachment.name || 'image.jpg';
  if (!fileToken) return '';

  const buffer = await client.downloadAttachment(fileToken);
  const uploaded = await ossService.uploadBuffer(buffer, fileName);

  await recordOssFile(client, settings, {
    fileName,
    ossPath: uploaded.path,
    ossUrl: uploaded.url,
    hash: uploaded.hash,
    fileSize: buffer.length,
    usage,
    recordId,
  });

  return uploaded.url;
}

async function fetchLocationCoords(
  client: FeishuClient,
  settings: FeishuConnectionSettings,
  fallback: LocationCoords
): Promise<LocationCoords> {
  if (!settings.feishuLocationsTableId) {
    return fallback;
  }

  try {
    const records = await client.listRecords(settings.feishuLocationsTableId);
    const next: LocationCoords = {};

    records.forEach((record) => {
      const id = getText(record.fields['地点ID']);
      if (!id) return;

      next[id] = {
        name: getText(record.fields['地点名称']) || id,
        x: getNumber(record.fields['坐标X(%)']),
        y: getNumber(record.fields['坐标Y(%)']),
      };
    });

    return Object.keys(next).length > 0 ? next : fallback;
  } catch (error) {
    console.warn('拉取地点表失败，已回退到本地配置：', error);
    return fallback;
  }
}

async function transformStoryRecords(
  client: FeishuClient,
  ossService: OssService,
  settings: FeishuConnectionSettings,
  records: FeishuRecord[],
  coords: LocationCoords
): Promise<LocationPoint[]> {
  const storiesByLocation = new Map<string, Story[]>();
  const batchSize = 5;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);

    await Promise.all(
      batch.map(async (record) => {
        const fields = record.fields;
        const locationId = getText(fields['地点ID']);
        const characterId = getText(fields['角色ID']);
        const content = getText(fields['故事内容']);
        if (!locationId || !characterId || !content) return;

        let avatarUrl = getText(fields['头像OSS_URL']) || getText(fields['头像URL']);
        let mainImageUrl = getText(fields['大图OSS_URL']) || getText(fields['大图URL']);
        let uploaded = false;

        if (ossService.isConfigured) {
          if (!avatarUrl && fields['头像']) {
            avatarUrl = await processAttachment(client, ossService, settings, fields['头像'], '头像', record.record_id);
            uploaded = uploaded || Boolean(avatarUrl);
          }

          if (!mainImageUrl && fields['大图']) {
            mainImageUrl = await processAttachment(client, ossService, settings, fields['大图'], '大图', record.record_id);
            uploaded = uploaded || Boolean(mainImageUrl);
          }

          if (uploaded && settings.feishuTableId) {
            await updateStoryImageUrls(
              client,
              settings.feishuTableId,
              record.record_id,
              avatarUrl,
              mainImageUrl
            );
          }
        }

        const story: Story = {
          id: record.record_id,
          characterId,
          characterName: getText(fields['角色名']) || '未命名角色',
          avatarUrl: avatarUrl || DEFAULT_AVATAR_URL,
          mainImageUrl: mainImageUrl || DEFAULT_SCENE_URL,
          content,
          author: getText(fields['投稿人']),
          date: getText(fields['日期']),
          locationId,
          locationName: getText(fields['地点名称']) || coords[locationId]?.name || locationId,
        };

        if (!storiesByLocation.has(locationId)) {
          storiesByLocation.set(locationId, []);
        }
        storiesByLocation.get(locationId)?.push(story);
      })
    );
  }

  const allLocationIds = new Set([...Object.keys(coords), ...storiesByLocation.keys()]);

  return Array.from(allLocationIds).map((locationId) => {
    const stories = storiesByLocation.get(locationId) ?? [];
    const location = coords[locationId] ?? {
      name: stories[0]?.locationName || locationId,
      x: 50,
      y: 50,
    };

    return {
      id: locationId,
      name: location.name,
      x: location.x,
      y: location.y,
      stories,
    };
  });
}

export async function runFeishuSync(
  settings: FeishuConnectionSettings,
  workspaceRoot = process.cwd()
): Promise<{ locationCount: number; storyCount: number }> {
  if (!settings.feishuTableId) {
    throw new Error('缺少 FEISHU_TABLE_ID，无法同步故事表');
  }

  const client = new FeishuClient(settings);
  const ossService = new OssService(settings);
  const fallbackCoords = await readWorkspaceJson<LocationCoords>(
    workspaceRoot,
    path.join('src', 'config', 'locations.json'),
    defaultLocationConfig
  );
  const coords = await fetchLocationCoords(client, settings, fallbackCoords);
  const records = await client.searchRecords(settings.feishuTableId, {
    ...(settings.feishuViewId ? { view_id: settings.feishuViewId } : {}),
    filter: {
      conjunction: 'and',
      conditions: [
        {
          field_name: '状态',
          operator: 'is',
          value: ['已发布'],
        },
      ],
    },
  });

  const locations = await transformStoryRecords(client, ossService, settings, records, coords);

  await writeWorkspaceJson(workspaceRoot, path.join('src', 'config', 'locations.json'), coords);
  await writeWorkspaceJson(workspaceRoot, path.join('src', 'data', 'content.json'), {
    locations,
  });

  return {
    locationCount: locations.length,
    storyCount: locations.reduce((total, location) => total + location.stories.length, 0),
  };
}
