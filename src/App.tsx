// V17.1.2-p4e — router uses registry; '/' redirects to '/finance'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { AppShell } from '@/components/layout/AppShell';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';
import { setActiveVersion } from '@/lib/version';

const VERSION = 'V17.1.2-p4f';
setActiveVersion(VERSION);

function Guarded({ element, roles }: { element: JSX.Element; roles?: Role[] }) {
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);
  const access = checkAccess([role], roles ?? []);
  return access.allowed ? element : <Navigate to="/finance" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell version={VERSION}>
        <React.Suspense fallback={<div className="p-4">Loading…</div>}>
          <Routes>
            {/* Default to Finance (single visible route) */}
            <Route path="/" element={<Navigate to="/finance" replace />} />
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