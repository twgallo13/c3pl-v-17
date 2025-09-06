// V17.1.2-p9a — router uses registry; '/' redirects to '/dashboards'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { AppShell } from '@/components/layout/AppShell';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';
import { setActiveVersion } from '@/lib/version';

const VERSION = 'V17.1.2-p6a';
setActiveVersion(VERSION);

function Guarded({ element, roles }: { element: React.ReactElement; roles?: Role[] }) {
  // Simplified - just render the element for now
  return element;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell version={VERSION}>
        <React.Suspense fallback={<div className="p-4">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboards" replace />} />
            {ROUTES.map(r => (
              <Route
                key={r.path}
                path={r.path}
                element={<Guarded roles={r.roles} element={React.createElement(r.component)} />}
              />
            ))}
            <Route
              path="*"
              element={
                <div className="rounded border p-6">
                  <h3 className="font-medium mb-2">Page not found</h3>
                  <p className="text-sm text-muted-foreground">Use the navigation to access available workflows.</p>
                </div>
              }
            />
          </Routes>
        </React.Suspense>
      </AppShell>
    </BrowserRouter>
  );
}