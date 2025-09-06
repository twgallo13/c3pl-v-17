// V17.1.2-p5a — Admin Sitemap (read-only)
import React from 'react';
import { ROUTES, type RouteDef } from '@/routes/registry';
import { getActiveVersion } from '@/lib/version';

export default function AdminSitemap() {
  const v = getActiveVersion();
  const rows: Array<RouteDef & { idx: number }> = ROUTES.map((r, i) => ({ ...r, idx: i }));
  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-3">Sitemap</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Path</th>
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Workflow</th>
              <th className="py-2 pr-3">Roles</th>
              <th className="py-2 pr-3">Visible</th>
              <th className="py-2">Version</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path} className="border-b last:border-0">
                <td className="py-2 pr-3">{r.path}</td>
                <td className="py-2 pr-3">{r.title}</td>
                <td className="py-2 pr-3">{r.workflow}</td>
                <td className="py-2 pr-3">{(r.roles ?? []).join(', ') || '—'}</td>
                <td className="py-2 pr-3">{r.visible === false ? 'hidden' : 'visible'}</td>
                <td className="py-2">{(r as any).version || v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}