// V17.1.2-p4g — dashboards landing (simple, themed cards)
import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardsHome() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded border p-4">
        <h3 className="font-medium mb-2">Finance</h3>
        <p className="text-sm text-muted-foreground mb-3">
          KPIs, AR aging, receipts & reconciliation.
        </p>
        <Link className="underline text-sm" to="/finance">Open Finance Dashboard →</Link>
      </section>

      <section className="rounded border p-4">
        <h3 className="font-medium mb-2">RMA</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Adjustments, credit memos, posting & reporting.
        </p>
        <Link className="underline text-sm" to="/rma/adjustments">Open RMA Adjustments →</Link>
      </section>
    </div>
  );
}