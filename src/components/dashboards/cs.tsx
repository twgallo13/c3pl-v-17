// V17.1.2-p6b — Customer Service Dashboard (read-only, safe defaults)
import React from 'react';

export default function CSDashboard(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Open Tickets</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">SLA Breaches</div>
          <div className="text-xl font-semibold">0</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg First Response</div>
          <div className="text-xl font-semibold">0m</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground mb-1">Backorders</div>
          <div className="text-xl font-semibold">0</div>
        </div>
      </div>

      {/* Reasons Trend */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Tickets by Reason (Last 7 Days)</h3>
        <div className="text-sm text-muted-foreground">No data yet.</div>
      </section>

      {/* Open Tickets Table */}
      <section className="rounded border p-4">
        <h3 className="font-medium mb-3">Open Tickets</h3>
        <div className="text-sm text-muted-foreground">No tickets to display.</div>
      </section>
    </div>
  );
}