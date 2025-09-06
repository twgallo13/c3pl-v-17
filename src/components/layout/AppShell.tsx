// V17.1.2-p4c — unified themed shell + sidebar
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';
import { HeaderRoleSwitcher } from '@/components/header/role-switcher';

type Group = { name: string; items: { path: string; title: string; roles?: Role[] }[] };

function groupRoutesByWorkflow(role: Role): Group[] {
  const visible = ROUTES.filter(r => r.visible !== false);
  const groups: Record<string, Group> = {};
  for (const r of visible) {
    const allowed = checkAccess([role], r.roles ?? []).allowed;
    if (!allowed) continue;
    if (!groups[r.workflow]) groups[r.workflow] = { name: r.workflow, items: [] };
    // prevent duplicate entries by path
    if (!groups[r.workflow].items.some(i => i.path === r.path)) {
      groups[r.workflow].items.push({ path: r.path, title: r.title, roles: r.roles });
    }
  }
  // stable order: Dashboards, Finance, RMA, Sales, Admin
  const order = ['Dashboards','Finance','RMA','Sales','Admin'];
  return Object.values(groups).sort((a,b)=> order.indexOf(a.name)-order.indexOf(b.name));
}

export function AppShell({ version, children }:{ version: string; children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);
  const { pathname } = useLocation();
  const groups = groupRoutesByWorkflow(role);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <div className="px-4 py-3 font-semibold">Returns & Finance Operations</div>
        <nav className="px-2 pb-6 space-y-4">
          {groups.map(g => (
            <div key={g.name}>
              <div className="px-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">{g.name}</div>
              <div className="space-y-1">
                {g.items.map(item => {
                  const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={
                        `block rounded px-3 py-2 text-sm ${active
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-muted'}`
                      }>
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="bg-background">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">C3PL</div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-2 py-1 rounded bg-muted">{version}</div>
            <div className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{role}</span>
            </div>
            <HeaderRoleSwitcher />
          </div>
        </header>
        <div className="p-4 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}