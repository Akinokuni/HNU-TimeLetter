import { FeishuClient } from '@/server/feishu/client';
import { getEnvSettings, mergeSettings } from '@/server/feishu/config';
import { getText } from '@/server/feishu/text';
import type { FeishuConnectionSettings, FeishuRecord } from '@/server/feishu/types';
import { resolveFeishuTableLink } from '@/server/feishu/wiki';

export type ExhibitionEntryKind = '灵感' | '故事' | '画面描述' | '参考图片';

export interface ExhibitionEntry {
  id: string;
  kind: ExhibitionEntryKind;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface ExhibitionSubmission {
  id: string;
  nickname: string;
  entries: ExhibitionEntry[];
}

export interface ExhibitionCard {
  id: string;
  cardId: string;
  submissions: ExhibitionSubmission[];
}

type EntrySlot = {
  selectField: string;
  textField?: string;
  imageField?: string;
};

const CARD_ID_FIELDS = ['CardID'];
const NICKNAME_FIELDS = ['昵称', '提交人'];
const DEFAULT_ALLOWED_KINDS = new Set<ExhibitionEntryKind>([
  '灵感',
  '故事',
  '画面描述',
  '参考图片',
]);
const IMAGE_FIELD = '请上传你的图片';
const ENTRY_SLOTS: EntrySlot[] = [
  {
    selectField: '请选择一个填写（如果需要上传图片的话请在这里选择图片）',
    textField: '请填写上述选择的相关介绍',
    imageField: IMAGE_FIELD,
  },
  {
    selectField: '请选择一个填写 2',
    textField: '请填写上述选择的相关介绍 2',
  },
  {
    selectField: '请选择一个填写',
    textField: '请填写上述选择的相关介绍 3',
  },
  {
    selectField: '请选择一个填写 3',
    textField: '请填写上述选择的相关介绍 4',
  },
];

function getFieldValue(fields: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (!(alias in fields)) {
      continue;
    }

    const value = fields[alias];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function getFieldText(fields: Record<string, unknown>, aliases: string[]): string {
  return getText(getFieldValue(fields, aliases)).trim();
}

function parseNickname(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (Array.isArray(value)) {
    const names = value
      .map((item) => parseNickname(item))
      .filter((item): item is string => Boolean(item));

    return names[0];
  }

  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;

    for (const key of ['nickname', 'name', 'full_name', 'en_name', 'display_name', 'text']) {
      const fieldValue = candidate[key];
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        return fieldValue.trim();
      }
    }
  }

  const text = getText(value).trim();
  return text || undefined;
}

function normalizeEntryKind(value: string): ExhibitionEntryKind | undefined {
  switch (value.trim()) {
    case '灵感':
      return '灵感';
    case '故事':
      return '故事';
    case '画面描述':
      return '画面描述';
    case '图片':
    case '参考图片':
      return '参考图片';
    default:
      return undefined;
  }
}

function getSelectOptionName(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const optionName = getSelectOptionName(item);
      if (optionName) {
        return optionName;
      }
    }
    return '';
  }

  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;

    for (const key of ['name', 'text', 'label']) {
      const fieldValue = candidate[key];
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        return fieldValue.trim();
      }
    }
  }

  return getText(value).trim();
}

function isLikelyPublicImageUrl(url: string): boolean {
  if (url.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname !== 'open.feishu.cn';
  } catch {
    return false;
  }
}

function extractFeishuFileToken(url: string): string | undefined {
  const mediaMatch = url.match(/\/medias\/([^/?]+)\/download/i);
  if (mediaMatch?.[1]) {
    return mediaMatch[1];
  }

  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get('file_token') ?? parsed.searchParams.get('token');
    if (fromQuery?.trim()) {
      return fromQuery.trim();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildAttachmentProxyUrl(fileToken: string): string {
  return `/api/feishu/attachment/${encodeURIComponent(fileToken)}`;
}

function getAttachmentUrl(field: unknown): string | undefined {
  if (!field) {
    return undefined;
  }

  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (!trimmed) {
      return undefined;
    }

    if (isLikelyPublicImageUrl(trimmed)) {
      return trimmed;
    }

    const fileToken = extractFeishuFileToken(trimmed);
    return fileToken ? buildAttachmentProxyUrl(fileToken) : undefined;
  }

  if (Array.isArray(field)) {
    const publicCandidate = field.find((item) => {
      const value = getAttachmentUrl(item);
      return value && !value.startsWith('/api/feishu/attachment/');
    });

    if (publicCandidate) {
      return getAttachmentUrl(publicCandidate);
    }

    for (const item of field) {
      const value = getAttachmentUrl(item);
      if (value) {
        return value;
      }
    }

    return undefined;
  }

  if (typeof field === 'object') {
    const candidate = field as Record<string, unknown>;
    const fileToken = typeof candidate.file_token === 'string' ? candidate.file_token.trim() : '';
    if (fileToken) {
      return buildAttachmentProxyUrl(fileToken);
    }

    for (const key of ['url', 'src', 'link']) {
      const fieldValue = candidate[key];
      if (typeof fieldValue === 'string' && fieldValue.trim() && isLikelyPublicImageUrl(fieldValue.trim())) {
        return fieldValue.trim();
      }
    }

    for (const key of ['url', 'tmp_url', 'preview_url', 'src', 'link']) {
      const fieldValue = candidate[key];
      if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
        continue;
      }

      const trimmed = fieldValue.trim();
      if (isLikelyPublicImageUrl(trimmed)) {
        return trimmed;
      }

      const tokenFromUrl = extractFeishuFileToken(trimmed);
      if (tokenFromUrl) {
        return buildAttachmentProxyUrl(tokenFromUrl);
      }
    }
  }

  return undefined;
}

async function resolveExhibitionSettings(): Promise<FeishuConnectionSettings | null> {
  const envSettings = getEnvSettings();
  let exhibitionAppToken = envSettings.feishuExhibitionAppToken?.trim();
  let exhibitionTableId = envSettings.feishuExhibitionTableId?.trim();
  let exhibitionViewId = envSettings.feishuExhibitionViewId?.trim();

  if (envSettings.feishuExhibitionWikiUrl?.trim()) {
    const resolved = await resolveFeishuTableLink(envSettings, envSettings.feishuExhibitionWikiUrl);
    exhibitionAppToken ||= resolved.appToken;
    exhibitionTableId ||= resolved.tableId;
    exhibitionViewId ||= resolved.viewId;
  }

  if (
    !envSettings.feishuAppId?.trim() ||
    !envSettings.feishuAppSecret?.trim() ||
    !exhibitionAppToken ||
    !exhibitionTableId
  ) {
    return null;
  }

  return mergeSettings(envSettings, {
    feishuAppToken: exhibitionAppToken,
    feishuTableId: exhibitionTableId,
    feishuViewId: exhibitionViewId,
  });
}

async function resolveCardSettings(): Promise<FeishuConnectionSettings | null> {
  const envSettings = getEnvSettings();
  let cardAppToken = envSettings.feishuCardAppToken?.trim();
  let cardTableId = envSettings.feishuCardTableId?.trim();
  let cardViewId = envSettings.feishuCardViewId?.trim();

  if (envSettings.feishuCardWikiUrl?.trim()) {
    const resolved = await resolveFeishuTableLink(envSettings, envSettings.feishuCardWikiUrl);
    cardAppToken ||= resolved.appToken;
    cardTableId ||= resolved.tableId;
    cardViewId ||= resolved.viewId;
  }

  if (
    !envSettings.feishuAppId?.trim() ||
    !envSettings.feishuAppSecret?.trim() ||
    !cardAppToken ||
    !cardTableId
  ) {
    return null;
  }

  return mergeSettings(envSettings, {
    feishuAppToken: cardAppToken,
    feishuTableId: cardTableId,
    feishuViewId: cardViewId,
  });
}

async function fetchRecords(settings: FeishuConnectionSettings): Promise<FeishuRecord[]> {
  if (!settings.feishuTableId) {
    return [];
  }

  const client = new FeishuClient(settings);
  if (settings.feishuViewId) {
    return client.searchRecords(settings.feishuTableId, {
      view_id: settings.feishuViewId,
    });
  }

  return client.listRecords(settings.feishuTableId);
}

async function resolveAllowedKinds(): Promise<Set<ExhibitionEntryKind>> {
  const settings = await resolveExhibitionSettings();
  if (!settings?.feishuTableId) {
    return new Set(DEFAULT_ALLOWED_KINDS);
  }

  try {
    const client = new FeishuClient(settings);
    const fields = await client.listFields(settings.feishuTableId);
    const allowedKinds = new Set<ExhibitionEntryKind>();

    for (const field of fields) {
      const normalized = normalizeEntryKind(field.field_name);
      if (normalized) {
        allowedKinds.add(normalized);
      }
    }

    return allowedKinds.size > 0 ? allowedKinds : new Set(DEFAULT_ALLOWED_KINDS);
  } catch (error) {
    console.warn('读取 exhibition 表结构失败，已退回默认内容类型。', error);
    return new Set(DEFAULT_ALLOWED_KINDS);
  }
}

function mapCardRecordToSubmission(
  record: FeishuRecord,
  allowedKinds: Set<ExhibitionEntryKind>
): { cardId: string; submission: ExhibitionSubmission } | null {
  const cardId = getFieldText(record.fields, CARD_ID_FIELDS);
  if (!cardId) {
    return null;
  }

  const entries: ExhibitionEntry[] = [];
  for (const slot of ENTRY_SLOTS) {
    const kind = normalizeEntryKind(getSelectOptionName(record.fields[slot.selectField]));
    if (!kind || !allowedKinds.has(kind)) {
      continue;
    }

    if (kind === '参考图片') {
      const imageUrl = getAttachmentUrl(record.fields[slot.imageField ?? IMAGE_FIELD]);
      if (imageUrl) {
        entries.push({
          id: `${record.record_id}-${slot.selectField}-image`,
          kind,
          imageUrl,
          imageAlt: `${cardId} 的参考图片`,
        });
      }
      continue;
    }

    if (!slot.textField) {
      continue;
    }

    const text = getFieldText(record.fields, [slot.textField]);
    if (!text) {
      continue;
    }

    entries.push({
      id: `${record.record_id}-${slot.selectField}-text`,
      kind,
      text,
    });
  }

  if (entries.length === 0) {
    return null;
  }

  return {
    cardId,
    submission: {
      id: record.record_id,
      nickname: parseNickname(getFieldValue(record.fields, NICKNAME_FIELDS)) ?? '匿名提交',
      entries,
    },
  };
}

function sortCards(cards: ExhibitionCard[]): ExhibitionCard[] {
  return [...cards].sort((left, right) => {
    const leftNumber = Number(left.cardId);
    const rightNumber = Number(right.cardId);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return left.cardId.localeCompare(right.cardId, 'zh-CN');
  });
}

function groupCardSubmissions(
  records: FeishuRecord[],
  allowedKinds: Set<ExhibitionEntryKind>
): ExhibitionCard[] {
  const grouped = new Map<string, ExhibitionCard>();

  for (const record of records) {
    const mapped = mapCardRecordToSubmission(record, allowedKinds);
    if (!mapped) {
      continue;
    }

    if (!grouped.has(mapped.cardId)) {
      grouped.set(mapped.cardId, {
        id: `card-${mapped.cardId}`,
        cardId: mapped.cardId,
        submissions: [],
      });
    }

    grouped.get(mapped.cardId)?.submissions.push(mapped.submission);
  }

  return sortCards(Array.from(grouped.values()));
}

export async function getExhibitionCards(): Promise<ExhibitionCard[]> {
  const cardSettings = await resolveCardSettings();
  if (!cardSettings) {
    return [];
  }

  const allowedKinds = await resolveAllowedKinds();

  try {
    const records = await fetchRecords(cardSettings);
    return groupCardSubmissions(records, allowedKinds);
  } catch (error) {
    console.warn('读取 CardID 归档表失败。', error);
    return [];
  }
}
