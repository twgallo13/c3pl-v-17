// V17.1.2-p4 — app shell + router from registry
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';
import { setActiveVersion } from '@/lib/version';
import { initializeVersionLock } from '@/lib/agent-guard';
import { HeaderRoleSwitcher } from '@/components/header/role-switcher';
import { ErrorBoundary } from '@/components/error-boundary';
import { Badge } from '@/components/ui/badge';

// Initialize version and guards
setActiveVersion('V17.1.2-p4b');
initializeVersionLock();

function AppShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>(getRole());
  const location = useLocation();
  
  React.useEffect(() => {
    return subscribe(setRole);
  }, []);

  const visibleRoutes = ROUTES.filter(r => r.visible !== false);
  const roleAllowedRoutes = visibleRoutes.filter(route => {
    if (!route.roles?.length) return true;
    const access = checkAccess([role], route.roles);
    return access.allowed;
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">C3PL</h2>
          <p className="text-sm text-muted-foreground">Returns & Finance Operations</p>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Navigation</div>
          <nav className="space-y-1">
            {roleAllowedRoutes.map(route => (
              <a 
                key={route.path}
                href={route.path}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === route.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {route.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Workflow Grouping */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Workflows</div>
          {['Dashboards', 'Finance', 'RMA', 'Sales', 'Admin'].map(workflow => {
            const workflowRoutes = roleAllowedRoutes.filter(r => r.workflow === workflow);
            if (workflowRoutes.length === 0) return null;
            
            return (
              <div key={workflow} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{workflow}</div>
                {workflowRoutes.map(route => (
                  <a
                    key={route.path}
                    href={route.path}
                    className={`block px-2 py-1 rounded text-xs transition-colors ${
                      location.pathname === route.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {route.title}
                  </a>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">C3PL</h1>
            <Badge variant="outline" className="text-xs">V17.1.2-p4b</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{role}</span>
            </div>
            <HeaderRoleSwitcher />
          </div>
        </header>
        
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function Guarded({ element, roles }: { element: JSX.Element; roles?: Role[] }) {
  const [role, setRole] = React.useState<Role>(getRole());
  
  React.useEffect(() => {
    return subscribe(setRole);
  }, []);
  
  const access = checkAccess([role], roles ?? []);
  return access.allowed ? element : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary actor="app" module="app">
      <BrowserRouter>
        <AppShell>
          <React.Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            <Routes>
              {ROUTES.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Guarded 
                      roles={route.roles} 
                      element={React.createElement(route.component)} 
                    />
                  }
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </AppShell>
      </BrowserRouter>
    </ErrorBoundary>
  );
}