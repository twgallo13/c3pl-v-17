// V17.1.2-p3b — safe utilities (null/shape guards + formatting)

}
export function safeNum(v: unknown,
}

export function safeNum(v: unknown, d = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
export function fmtCurrency(n: unknown): string {
  return ne
 












