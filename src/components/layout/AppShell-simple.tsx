// V17.1.2-p9a — simplified app shell
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { getRole, subscribe, type Role } from '@/lib/role-store';

export function AppShell({ version, children }: { version: string; children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);
  const { pathname } = useLocation();

  // Simple route filtering - show all visible routes for any role
  const visibleRoutes = ROUTES.filter(r => r.visible !== false);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-white">
        <div className="px-4 py-3 font-semibold">C3PL Operations</div>
        <nav className="px-2 pb-6 space-y-1">
          {visibleRoutes.map(route => {
            const active = pathname === route.path || (route.path !== '/' && pathname.startsWith(route.path));
            return (
              <Link
                key={route.path}
                to={route.path}
                className={
                  `block rounded px-3 py-2 text-sm ${active
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-muted'}`
                }>
                {route.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="bg-background">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">C3PL</div>
          <div className="text-xs px-2 py-1 rounded bg-muted">{version}</div>
        </header>
        <div className="p-4 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}