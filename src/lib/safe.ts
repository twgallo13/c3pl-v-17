// V17.1.2-p3d — safe utilities (null/shape guards + formatting)

export function safeArr<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

export function safeNum(v: unknown, d = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return d;
}

export function safeStr(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d;
}

export function fmtCurrency(n: unknown): string {
  const x = safeNum(n, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(x);
}