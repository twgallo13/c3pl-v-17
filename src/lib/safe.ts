// V17.1.2-p3 — safe utilities (null/shape guards + formatting)

}
export function safeNum(v: unknown,
 

export function safeStr(v: unknown, d = ''): string 
}
export function fmtCurrency(n: unknown): string {
  return ne
 





export function fmtCurrency(n: unknown): string {
  const x = safeNum(n, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(x);
}