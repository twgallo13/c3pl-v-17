// V17.1.2-p6a — RMA Dashboard (read-only, safe defaults)
import React from 'react';

export default function RmaDashboard(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">RMAs Open</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending Inspection</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending Credit</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg Cycle Time</div>
          <div className="text-xl font-semibold">0d</div>
        </div>
      </div>

      {/* Dispositions */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Dispositions Split</h3>
        <div className="text-sm text-muted-foreground">No disposition data yet.</div>
      </section>

      {/* Credits Pending */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Credits Pending</h3>
        <div className="text-sm text-muted-foreground">No credits pending.</div>
      </section>
    </div>
  );
}