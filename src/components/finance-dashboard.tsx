// V17.1.2-p7b — Finance Dashboard uses adapter (flagged), UI unchanged
import React from 'react';
import { withErrorBoundary } from '@/components/error-boundary';
import { fmtCurrency, safeArr, safeNum, safeStr } from '@/lib/safe';
import { fetchFinanceDashboard, type FinanceDashboardData } from '@/lib/finance-api';

function StatCard(props: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded border p-4">
      <div className="text-xs text-muted-foreground mb-1">{props.label}</div>
      <div className="text-xl font-semibold">{props.value}</div>
      {props.sub ? <div className="text-xs text-muted-foreground mt-1">{props.sub}</div> : null}
    </div>
  );
}

function MiniBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-3 rounded bg-muted-foreground/40" style={{ height: `${Math.round((d.value / max) * 96)}px` }} />
          <div className="text-[10px] mt-1">{d.label.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border p-4">
      <h3 className="font-medium mb-3">{title}</h3>
      {children}
    </section>
  );
}

function FinanceDashboardImpl(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<FinanceDashboardData | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetchFinanceDashboard();
      setData(res);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="rounded border p-4">Loading finance data…</div>;

  const totals = data?.totals ?? { total_ar: 0, overdue_ar: 0, open_invoices: 0, dso: 0 };
  const aging = data?.aging ?? { current: 0, d31_60: 0, d61_90: 0, d90_plus: 0 };
  const receipts = safeArr(data?.receipts_last_14d).map(d => ({ label: safeStr(d.date), value: safeNum(d.amount, 0) }));
  const top = safeArr(data?.top_customers);
  const invoices = safeArr(data?.invoices_recent);
  const posting = data?.posting ?? { posted: 0, unposted: 0, errors: 0 };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total AR" value={fmtCurrency(totals.total_ar)} />
        <StatCard label="Overdue" value={fmtCurrency(totals.overdue_ar)} />
        <StatCard label="Open Invoices" value={totals.open_invoices} />
        <StatCard label="DSO" value={`${totals.dso} days`} />
      </div>

      <Section title="AR Aging">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="0-30" value={fmtCurrency(aging.current)} />
          <StatCard label="31-60" value={fmtCurrency(aging.d31_60)} />
          <StatCard label="61-90" value={fmtCurrency(aging.d61_90)} />
          <StatCard label="90+" value={fmtCurrency(aging.d90_plus)} />
        </div>
      </Section>

      <Section title="Receipts (last 14 days)">
        {receipts.length ? <MiniBars data={receipts} /> : <div className="text-sm text-muted-foreground">No receipts recorded in the last 14 days.</div>}
      </Section>

      <Section title="Top Customers by AR">
        {top.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">AR</th>
                  <th className="py-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c, i) => {
                  const pct = totals.total_ar ? Math.round((safeNum(c.ar, 0) / totals.total_ar) * 100) : 0;
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3">{safeStr(c.client)}</td>
                      <td className="py-2 pr-3">{fmtCurrency(safeNum(c.ar, 0))}</td>
                      <td className="py-2">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No customer concentration to display.</div>
        )}
      </Section>

      <Section title="Recent Invoices">
        {invoices.length ? (
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
        ) : (
          <div className="text-sm text-muted-foreground">No recent invoices.</div>
        )}
      </Section>

      <Section title="GL Posting Status">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Posted" value={posting.posted} />
          <StatCard label="Unposted" value={posting.unposted} />
          <StatCard label="Errors" value={posting.errors} />
        </div>
      </Section>
    </div>
  );
}

export default withErrorBoundary(FinanceDashboardImpl, { module: 'finance', component: 'finance-dashboard' });