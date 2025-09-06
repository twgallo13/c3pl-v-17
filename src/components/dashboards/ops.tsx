// V17.1.2-p6a — Ops/WMS Dashboard (read-only, safe defaults)
import React from 'react';

export default function OpsDashboard(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Waves In Progress</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Orders To Pick</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Lines Short</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">SLA At Risk</div>
          <div className="text-xl font-semibold">0</div>
        </div>
      </div>

      {/* Throughput */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Pick/Pack Throughput (Last 7 Days)</h3>
        <div className="text-sm text-muted-foreground">No data yet.</div>
      </section>

      {/* Exceptions */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Exceptions</h3>
        <div className="text-sm text-muted-foreground">No exceptions to show.</div>
      </section>
    </div>
  );
}