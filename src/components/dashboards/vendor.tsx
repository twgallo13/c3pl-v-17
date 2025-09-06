// V17.1.2-p6b — Vendor Dashboard (read-only, safe defaults)
import React from 'react';

export default function VendorDashboard(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">ASN On-Time %</div>
          <div className="text-xl font-semibold">0%</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Fill Rate</div>
          <div className="text-xl font-semibold">0%</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Returns Rate</div>
          <div className="text-xl font-semibold">0%</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending Invoices</div>
          <div className="text-xl font-semibold">0</div>
        </div>
      </div>

      {/* Shipment Schedule */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Upcoming Shipments</h3>
        <div className="text-sm text-muted-foreground">No shipments scheduled.</div>
      </section>

      {/* Invoice Exceptions */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Invoice Exceptions</h3>
        <div className="text-sm text-muted-foreground">No exceptions to show.</div>
      </section>
    </div>
  );
}