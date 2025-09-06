// V17.1.2-p7b — Finance data adapter (flagged, null-safe)
import { safeArr, safeNum, safeStr } from '@/lib/safe';

export type AgingBuckets = { current: number; d31_60: number; d61_90: number; d90_plus: number };
export type ReceiptDay = { date: string; amount: number };

export type FinanceDashboardData = {
  totals: { total_ar: number; overdue_ar: number; open_invoices: number; dso: number };
  aging: AgingBuckets;
  receipts_last_14d: ReceiptDay[];
  top_customers: { client: string; ar: number }[];
  invoices_recent: { id: string; client: string; status: string; balance: number; gl_journal_id: string | null }[];
  posting: { posted: number; unposted: number; errors: number };
};

const DEFAULTS: FinanceDashboardData = {
  totals: { total_ar: 0, overdue_ar: 0, open_invoices: 0, dso: 0 },
  aging: { current: 0, d31_60: 0, d61_90: 0, d90_plus: 0 },
  receipts_last_14d: [],
  top_customers: [],
  invoices_recent: [],
  posting: { posted: 0, unposted: 0, errors: 0 },
};

function mapResponse(json: any): FinanceDashboardData {
  return {
    totals: {
      total_ar: safeNum(json?.totals?.total_ar, 0),
      overdue_ar: safeNum(json?.totals?.overdue_ar, 0),
      open_invoices: safeNum(json?.totals?.open_invoices, 0),
      dso: safeNum(json?.totals?.dso, 0),
    },
    aging: {
      current: safeNum(json?.aging?.current, 0),
      d31_60: safeNum(json?.aging?.d31_60, 0),
      d61_90: safeNum(json?.aging?.d61_90, 0),
      d90_plus: safeNum(json?.aging?.d90_plus, 0),
    },
    receipts_last_14d: safeArr(json?.receipts_last_14d).map((r: any) => ({
      date: safeStr(r?.date),
      amount: safeNum(r?.amount, 0),
    })),
    top_customers: safeArr(json?.top_customers).map((r: any) => ({
      client: safeStr(r?.client),
      ar: safeNum(r?.ar, 0),
    })),
    invoices_recent: safeArr(json?.invoices_recent).map((r: any) => ({
      id: safeStr(r?.id),
      client: safeStr(r?.client),
      status: safeStr(r?.status),
      balance: safeNum(r?.balance, 0),
      gl_journal_id: r?.gl_journal_id ? String(r.gl_journal_id) : null,
    })),
    posting: {
      posted: safeNum(json?.posting?.posted, 0),
      unposted: safeNum(json?.posting?.unposted, 0),
      errors: safeNum(json?.posting?.errors, 0),
    },
  };
}

export async function fetchFinanceDashboard(): Promise<FinanceDashboardData> {
  const useApi = (import.meta as any).env?.VITE_FINANCE_API === '1';
  if (!useApi) return DEFAULTS;

  try {
    const res = await fetch('/api/finance/dashboard', { method: 'GET' });
    if (!res.ok) {
      console.warn('V17.1.2-p7b finance adapter: non-OK', res.status);
      return DEFAULTS;
    }
    const json = await res.json().catch(() => ({}));
    return mapResponse(json);
  } catch (e) {
    console.error('V17.1.2-p7b finance adapter error:', e);
    return DEFAULTS;
  }
}