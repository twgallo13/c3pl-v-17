// V17.1.2 — RMA adjustments list items
export type RmaAdjustment = {
  id: string;
  artifact_type?: string;   // 'credit_memo' | 'fee' | 'rtv' | 'repair'
  amount?: number;
  gl_journal_id?: string|null;
  posted_at?: string|null;
};

export function coerceRmaAdj(row: any): RmaAdjustment {
  return {
    id: String(row?.id ?? ''),
    artifact_type: typeof row?.artifact_type === 'string' ? row.artifact_type : undefined,
    amount: typeof row?.amount === 'number' ? row.amount : (typeof row?.amount === 'string' ? Number(row.amount) : 0),
    gl_journal_id: row?.gl_journal_id ? String(row.gl_journal_id) : (row?.accounting_adjustments?.[0]?.gl_journal_id ?? null),
    posted_at: row?.posted_at ? String(row.posted_at) : null,
  };
}