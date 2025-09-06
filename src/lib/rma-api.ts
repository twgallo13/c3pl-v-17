// V17.1.2-p7c — RMA Adjustments data adapter (flagged, null-safe)
import { safeArr, safeNum, safeStr } from '@/lib/safe';

export type RmaAdjustment = {
  id: string;
  artifact_type?: string;
  amount?: number;
  gl_journal_id?: string | null;
  posted_at?: string | null;
};

export async function fetchRmaAdjustments(): Promise<RmaAdjustment[]> {
  const useApi = (import.meta as any).env?.VITE_RMA_API === '1';
  if (!useApi) return [];

  try {
    const res = await fetch('/api/rma/adjustments', { method: 'GET' });
    if (!res.ok) {
      console.warn('V17.1.2-p7c rma adapter: non-OK', res.status);
      return [];
    }
    const json = await res.json().catch(() => ({}));
    const rows = safeArr(json?.items ?? json); // support either {items:[]} or []
    return rows.map((r: any) => ({
      id: safeStr(r?.id),
      artifact_type: safeStr(r?.artifact_type ?? r?.type ?? ''),
      amount: safeNum(r?.amount, 0),
      gl_journal_id: r?.gl_journal_id ? String(r.gl_journal_id) : null,
      posted_at: r?.posted_at ? String(r.posted_at) : null,
    }));
  } catch (e) {
    console.error('V17.1.2-p7c rma adapter error:', e);
    return [];
  }
}