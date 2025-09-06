// V17.1.2-p8a — AppShell with explicit nav (Products added, Sitemap removed)
import React from 'react';
import { NavLink } from 'react-router-dom';
import { type Role } from '@/lib/role-store';

type Item = { path: string; title: string; roles?: Role[] };
type Group = { name: string; items: Item[] };

const NAV: Group[] = [
  {
    name: 'Dashboards',
    items: [
      { path: '/dashboards', title: 'Dashboards' }, // overview
      { path: '/dashboards/ops', title: 'Ops Dashboard' },
      { path: '/dashboards/rma', title: 'RMA Dashboard' },
      { path: '/dashboards/cs', title: 'CS Dashboard' },
      { path: '/dashboards/vendor', title: 'Vendor Dashboard' },
      { path: '/dashboards/finance', title: 'Finance Dashboard' },
    ],
  },
  {
    name: 'RMA',
    items: [{ path: '/rma/adjustments', title: 'RMA Adjustments' }],
  },
  {
    name: 'Admin',
    items: [
      // Sitemap intentionally removed
      { path: '/products', title: 'Products' },
    ],
  },
];

export default function AppShell({
  version,
  children,
}: {
  version: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-muted/20">
        <div className="px-4 py-4 font-semibold text-lg">Returns & Finance Operations</div>
        <nav className="px-2">
          {NAV.map((g) => (
            <div key={g.name} className="mb-4">
              <div className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {g.name}
              </div>
              <ul className="space-y-1">
                {g.items.map((it) => (
                  <li key={it.path}>
                    <NavLink
                      to={it.path}
                      className={({ isActive }) =>
                        [
                          'block rounded px-3 py-2 text-sm',
                          isActive ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                        ].join(' ')
                      }
                    >
                      {it.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="px-3 py-4 text-xs text-muted-foreground">V{version}</div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <div className="text-xl font-semibold">C3PL</div>
          <span className="rounded bg-muted px-2 py-1 text-xs">V{version}</span>
        </header>
        <section className="p-4">{children}</section>
      </main>
    </div>
  );
}