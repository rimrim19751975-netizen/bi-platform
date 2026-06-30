export function sanitizeTableName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .substring(0, 63)
    .toLowerCase();
}

export function detectDataType(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'text';

  const str = String(value);

  if (/^-?\d+$/.test(str) && str.length < 15) return 'integer';
  if (/^-?\d+\.?\d*$/.test(str)) return 'float';

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return 'date';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) return 'date';

  if (/^(true|false|vrai|faux|oui|non|yes|no)$/i.test(str)) return 'boolean';

  const phonePattern = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}$/;
  if (phonePattern.test(str)) return 'phone';

  const gpsPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
  if (gpsPattern.test(str)) return 'gps';

  if (/^[A-Z0-9_-]+$/i.test(str) && str.length >= 8) return 'identifier';

  return 'text';
}

export function getDateRange(period: 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end: now };
}

export function paginate(page: number = 1, limit: number = 50): { skip: number; take: number } {
  const p = Math.max(1, page);
  const l = Math.min(500, Math.max(1, limit));
  return { skip: (p - 1) * l, take: l };
}
