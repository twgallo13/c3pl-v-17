// V17.1.2 — very light validators (no external deps)
export type InvoiceLite = { 
  id: string; 
  client?: string; 
  status?: string; 
  balance?: number; 
  gl_journal_id?: string|null 
};

export function coerceInvoiceLite(row: any): InvoiceLite {
  return {
    id: String(row?.id ?? ''),
    client: typeof row?.client === 'string' ? row.client : undefined,
    status: typeof row?.status === 'string' ? row.status : undefined,
    balance: typeof row?.balance === 'number' ? row.balance : (typeof row?.balance === 'string' ? Number(row.balance) : 0),
    gl_journal_id: row?.gl_journal_id ? String(row.gl_journal_id) : null,
  };
}