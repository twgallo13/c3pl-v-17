// V17.1.2 — safe guards used by finance & rma UIs
  return Array.isArray(v) ? v : []; 
  return Array.isArray(v) ? v : []; 
 

export function safeNum(v: unknown, d = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return d;
}








