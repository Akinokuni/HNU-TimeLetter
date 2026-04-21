export function formatDateTime(value: unknown): string {
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
}
