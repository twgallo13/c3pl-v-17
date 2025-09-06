// V17.1.2-p4h — RMA Adjustments (stable, compilable)
import React from 'react';
import { withErrorBoundary } from '@/components/error-boundary';
import { logEvent, stamp } from '@/lib/build-log';
import { safeArr, fmtCurrency, safeStr, safeNum } from '@/lib/safe';

type RmaAdjustment = {
  id: string;
  artifact_type?: string;
  amount?: number;
  gl_journal_id?: string | null;
  posted_at?: string | null;
};

const tag = stamp('V17.1.2-p4h', 'rma');

async function fetchAdjustments(): Promise<RmaAdjustment[]> {
  try {
    const res = await fetch('/api/rma/adjustments', { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    return safeArr(json?.items).map((r: any) => ({
      id: String(r?.id ?? ''),
      artifact_type: typeof r?.artifact_type === 'string' ? r.artifact_type : undefined,
      amount:
        typeof r?.amount === 'number'
          ? r.amount
          : typeof r?.amount === 'string'
          ? Number(r.amount)
          : 0,
      gl_journal_id: r?.gl_journal_id
        ? String(r.gl_journal_id)
        : r?.accounting_adjustments?.[0]?.gl_journal_id ?? null,
      posted_at: r?.posted_at ? String(r.posted_at) : null,
    }));
  } catch (e) {
    logEvent({
      version: 'V17.1.2-p4h',
      module: 'rma',
      action: 'adjustments_load_error',
      details: { message: String(e) },
    });
    return [];
  }
}

function RmaAdjustmentsImpl() {
  const [rows, setRows] = React.useState<RmaAdjustment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      tag('adjustments_load_start');
      const list = await fetchAdjustments();
      setRows(list);
      tag('adjustments_load_success', { count: list.length });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="rounded border p-4">Loading adjustments…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded border p-6">
        <h3 className="font-medium mb-1">RMA Adjustments</h3>
        <p className="text-sm text-muted-foreground">
          No adjustments found. When available, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-3">RMA Adjustments</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Artifact</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">GL Journal</th>
              <th className="py-2">Posted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{safeStr(r.artifact_type)}</td>
                <td className="py-2 pr-3">{fmtCurrency(safeNum(r.amount, 0))}</td>
                <td className="py-2 pr-3">{safeStr(r.gl_journal_id ?? '')}</td>
                <td className="py-2">{safeStr(r.posted_at ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withErrorBoundary(RmaAdjustmentsImpl, {
  module: 'rma',
  component: 'rma-adjustments',
});