// V17.1.2-p8f5c — minimal AppShell with header + nav
import React from 'react';
import { Link } from 'react-router-dom';

export default function AppShell({
  version,
  children,
}: {
  version: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Collab3PL</div>
          <nav className="text-sm flex gap-4">
            <Link to="/dashboards/finance">Finance</Link>
            <Link to="/products">Products</Link>
          </nav>
          <div className="text-xs opacity-70">Version: {version}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
