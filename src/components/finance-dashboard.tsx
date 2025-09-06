// V17.1.2-p4e — finance dashboard: safe, no-throw rendering
import React from 'react';
import { withErrorBoundary } from '@/components/error-boundary';
import { logEvent, stamp } from '@/lib/build-log';
import { safeArr, fmtCurrency, safeStr, safeNum } from '@/lib/safe';

type InvoiceLite = {
  id: string;
  client?: string;
  status?: string;
  balance?: number;
  gl_journal_id?: string | null;
};

const tag = stamp('V17.1.2-p4e', 'finance');

async function loadFinance(): Promise<{ invoices: InvoiceLite[] }> {
  try {
    const res = await fetch('/api/finance/dashboard', { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    const raw = safeArr(json?.invoices);
    const mapped: InvoiceLite[] = raw.map((r: any) => ({
      id: String(r?.id ?? ''),
      client: typeof r?.client === 'string' ? r.client : undefined,
      status: typeof r?.status === 'string' ? r.status : undefined,
      balance: typeof r?.balance === 'number' ? r.balance : (typeof r?.balance === 'string' ? Number(r.balance) : 0),
      gl_journal_id: r?.gl_journal_id ? String(r.gl_journal_id) : null,
    }));
    return { invoices: mapped };
  } catch (e) {
    // Network or 500 — treat as empty and log, but NEVER throw
    logEvent({ version: 'V17.1.2-p4e', module: 'finance', action: 'dashboard_load_error', details: { message: String(e) } });
    return { invoices: [] };
  }
}

function FinanceDashboardImpl() {
  const [loading, setLoading] = React.useState(true);
  const [invoices, setInvoices] = React.useState<InvoiceLite[]>([]);

  React.useEffect(() => {
    (async () => {
      tag('dashboard_load_start');
      const data = await loadFinance();
      setInvoices(safeArr(data.invoices));
      tag('dashboard_load_success', { count: data.invoices.length });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="rounded border p-4">Loading finance data…</div>;
  }

  // Empty state (do NOT crash)
  if (!invoices.length) {
    return (
      <div className="rounded border p-6">
        <h3 className="font-medium mb-1">Finance Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          No invoice data available yet. Check API connectivity or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="font-medium mb-3">Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Invoice</th>
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Balance</th>
                <th className="py-2">GL</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{safeStr(inv.id)}</td>
                  <td className="py-2 pr-3">{safeStr(inv.client)}</td>
                  <td className="py-2 pr-3">{safeStr(inv.status)}</td>
                  <td className="py-2 pr-3">{fmtCurrency(safeNum(inv.balance, 0))}</td>
                  <td className="py-2">{safeStr(inv.gl_journal_id ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withErrorBoundary(FinanceDashboardImpl, { module: 'finance', component: 'finance-dashboard' });