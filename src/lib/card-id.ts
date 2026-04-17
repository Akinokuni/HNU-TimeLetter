import { randomInt } from 'node:crypto';
import { FeishuClient } from '@/server/feishu/client';
import { getEnvSettings, mergeSettings } from '@/server/feishu/config';
import { getText } from '@/server/feishu/text';
import type { FeishuConnectionSettings } from '@/server/feishu/types';
import { resolveFeishuTableLink } from '@/server/feishu/wiki';

const DEFAULT_CARD_ID_FIELD_NAME = 'CardID';
const DEFAULT_CARD_ID_LENGTH = 6;

export interface CardIdGeneratorResult {
  cardId: string;
  usedCount: number;
  remainingCount: number;
  selfPath: string;
  exhibitionPath: string;
}

type ResolvedCardSettings = {
  settings: FeishuConnectionSettings;
  fieldName: string;
};

function getCardIdLength() {
  const parsed = Number.parseInt(process.env.FEISHU_CARD_ID_LENGTH ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CARD_ID_LENGTH;
}

function getCardIdRange() {
  const length = getCardIdLength();
  const defaultMin = length === 1 ? 0 : 10 ** (length - 1);
  const defaultMax = 10 ** length - 1;
  const min = Number.parseInt(process.env.FEISHU_CARD_ID_MIN ?? '', 10);
  const max = Number.parseInt(process.env.FEISHU_CARD_ID_MAX ?? '', 10);

  return {
    length,
    min: Number.isFinite(min) ? min : defaultMin,
    max: Number.isFinite(max) ? max : defaultMax,
  };
}

function normalizeCardId(value: string, length: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(length, '0');
  }

  return trimmed;
}

async function resolveCardSettings(): Promise<ResolvedCardSettings | null> {
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

  return {
    settings: mergeSettings(envSettings, {
      feishuAppToken: cardAppToken,
      feishuTableId: cardTableId,
      feishuViewId: cardViewId,
    }),
    fieldName: envSettings.feishuCardIdFieldName?.trim() || DEFAULT_CARD_ID_FIELD_NAME,
  };
}

async function getAssignedCardIds(resolved: ResolvedCardSettings): Promise<Set<string>> {
  const { settings, fieldName } = resolved;
  const client = new FeishuClient(settings);
  const records = settings.feishuViewId
    ? await client.searchRecords(settings.feishuTableId!, { view_id: settings.feishuViewId })
    : await client.listRecords(settings.feishuTableId!);
  const { length } = getCardIdRange();
  const assigned = new Set<string>();

  for (const record of records) {
    const rawValue = getText(record.fields[fieldName]);
    const normalized = normalizeCardId(rawValue, length);
    if (normalized) {
      assigned.add(normalized);
    }
  }

  return assigned;
}

function buildQueryPath(basePath: string, cardId: string) {
  return `${basePath}?CardID=${encodeURIComponent(cardId)}`;
}

function pickAvailableCardId(assigned: Set<string>) {
  const { length, min, max } = getCardIdRange();
  const capacity = max - min + 1;

  if (assigned.size >= capacity) {
    throw new Error('可用 CardID 已经用完，请扩大随机范围后再试。');
  }

  for (let attempt = 0; attempt < 256; attempt += 1) {
    const candidate = String(randomInt(min, max + 1)).padStart(length, '0');
    if (!assigned.has(candidate)) {
      return { cardId: candidate, capacity };
    }
  }

  const offset = randomInt(0, capacity);
  for (let index = 0; index < capacity; index += 1) {
    const value = min + ((offset + index) % capacity);
    const candidate = String(value).padStart(length, '0');
    if (!assigned.has(candidate)) {
      return { cardId: candidate, capacity };
    }
  }

  throw new Error('没有找到可用的 CardID。');
}

export async function generateAvailableCardId(): Promise<CardIdGeneratorResult> {
  const resolved = await resolveCardSettings();
  if (!resolved) {
    throw new Error('缺少 CardID 生成器的飞书配置。');
  }

  const assigned = await getAssignedCardIds(resolved);
  const { cardId, capacity } = pickAvailableCardId(assigned);

  return {
    cardId,
    usedCount: assigned.size,
    remainingCount: capacity - assigned.size - 1,
    selfPath: buildQueryPath('/card-id', cardId),
    exhibitionPath: buildQueryPath('/exhibition', cardId),
  };
}
