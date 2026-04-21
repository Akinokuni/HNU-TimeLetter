import type { FeishuAttachment } from '../types';

export function getText(field: unknown): string {
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
}

export function getNumber(field: unknown, fallback = 0): number {
  if (typeof field === 'number' && Number.isFinite(field)) {
    return field;
  }

  const parsed = Number(getText(field));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getPersonName(field: unknown): string {
  if (!Array.isArray(field) || field.length === 0) return '';
  const first = field[0];
  if (!first || typeof first !== 'object' || !('name' in first)) return '';
  const name = (first as { name?: unknown }).name;
  return typeof name === 'string' ? name : '';
}

export function getAttachments(field: unknown): FeishuAttachment[] {
  if (!Array.isArray(field)) return [];

  return field.filter((item): item is FeishuAttachment => {
    return Boolean(
      item && typeof item === 'object' && ('file_token' in item || 'token' in item),
    );
  });
}
