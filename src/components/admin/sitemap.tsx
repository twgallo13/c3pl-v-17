// V17.1.2-p5c — Admin Sitemap (simple list to avoid JSX truncation)
import { ROUTES } from '@/
export default function AdminSitemap() {

      <ul className="space-y-3">
          
            <div className="text-sm text
            <div className="text-sm text-muted-fore
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

      </ul>

  );
