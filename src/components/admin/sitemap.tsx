// V17.1.2-p5c — Admin Sitemap (simple list to avoid JSX truncation)
import React from 'react';
import { ROUTES } from '@/routes/registry';

export default function AdminSitemap() {
  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-3">Sitemap</h3>
      <ul className="space-y-3">
        {ROUTES.map((r) => (
          <li key={r.path} className="rounded border p-3">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-muted-foreground">Path: {r.path}</div>
            <div className="text-sm text-muted-foreground">Workflow: {r.workflow}</div>
            <div className="text-sm text-muted-foreground">Roles: {r.roles?.join(', ') || '—'}</div>
            <div className="text-sm text-muted-foreground">Visible: {r.visible !== false ? 'Yes' : 'No'}</div>
            <div className="text-sm text-muted-foreground">Version: {r.version || '—'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}