// V17.1.2-rma-sync-hotfix — RMA Adjustments (adapter only; safe states)
import React from 'react';
import { fmtCurrency, safeNum, safeStr } from '@/lib/safe';
import { fetchRmaAdjustments, type RmaAdjustment } from '@/lib/rma-api';

export default function RmaAdjustments(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<RmaAdjustment[]>([]);

  React.useEffect(() => {
    (async () => {
      const data = await fetchRmaAdjustments();
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded border p-6">
        <h3 className="font-medium mb-1">RMA Adjustments</h3>
        <p className="text-sm text-muted-foreground">Loading adjustments…</p>
      </div>
    );
  }

  if (!rows.length) {
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
