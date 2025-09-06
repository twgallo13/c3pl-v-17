// V17.1.2 — role-based landing + registry router (hotfix version tag)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import AppShell from '@/components/layout/AppShell';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';
import { setActiveVersion } from '@/lib/version';

const ProductsView = React.lazy(() => import('@/components/products-view'));

const VERSION = 'V17.1.2-p8';
setActiveVersion(VERSION);

function landingFor(role: Role): string {
  switch (role) {
    case 'Admin':          return '/dashboards';
    case 'Finance':        return '/dashboards/finance';
    case 'Operations':     return '/dashboards/ops';
    case 'CustomerService':return '/dashboards/cs';
    case 'Vendor':         return '/dashboards/vendor';
    default:               return '/dashboards';
  }
}

function Guarded(props: { element: JSX.Element; roles?: Role[] }) {
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);
  const access = checkAccess([role], props.roles ?? []);
  return access.allowed ? props.element : <Navigate to={landingFor(role)} replace />;
}

export default function App() {
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);

  return (
    <BrowserRouter>
      <AppShell version={VERSION}>
        <React.Suspense fallback={<div className="p-4">Loading…</div>}>
          <Routes>
            {/* Role-based landing for "/" */}
            <Route path="/" element={<Navigate to={landingFor(role)} replace />} />
            <Route
              path="/products"
              element={<ProductsView />}
            />
            {ROUTES.map((r) => (
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
                  <p className="text-sm text-muted-foreground">
                    Use the navigation to access available workflows.
                  </p>
                </div>
              }
            />
          </Routes>
        </React.Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
