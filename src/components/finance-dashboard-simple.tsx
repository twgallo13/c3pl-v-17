// V17.1.2-p9a — finance dashboard: simplified and safe
import React from 'react';

export default function FinanceDashboard() {
  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="font-medium mb-3">Finance Dashboard</h3>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Finance overview and KPIs will appear here.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Total AR</div>
              <div className="text-lg font-semibold">$0.00</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Open Invoices</div>
              <div className="text-lg font-semibold">0</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-muted-foreground">Overdue</div>
              <div className="text-lg font-semibold">$0.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}