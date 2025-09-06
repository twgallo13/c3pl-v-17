// V17.1.2-p5b — RMA Adjustments (compile-stable minimal view)
import React from 'react';
import { fmtCurrency, safeNum, safeStr } from '@/lib/safe';

type RmaAdjustment = {
  id: string;
  artifact_type?: string;
  amount?: number;
  gl_journal_id?: string | null;
  posted_at?: string | null;
};

const MOCK_ROWS: RmaAdjustment[] = [];

export default function RmaAdjustments() {
  const rows = MOCK_ROWS; // placeholder until API is wired

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