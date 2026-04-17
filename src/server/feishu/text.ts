export function getText(field: unknown): string {
  if (!field) return '';
  if (typeof field === 'string') return field;

  if (Array.isArray(field)) {
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
  if (typeof field === 'number' && Number.isFinite(field)) return field;
  const parsed = Number(getText(field));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function hasValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}
