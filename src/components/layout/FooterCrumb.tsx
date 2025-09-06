// V17.1.2-p5 — footer crumb: Workflow • Route • Version
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/registry';
import { getActiveVersion } from '@/lib/version';

export default function FooterCrumb() {
  const { pathname } = useLocation();

  const route = React.useMemo(() => {
    let r = ROUTES.find((x) => x.path === pathname);
    if (!r) r = ROUTES.find((x) => x.path !== '/' && pathname.startsWith(x.path));
    return r;
  }, [pathname]);

  const workflow = route?.workflow ?? 'Unknown';
  const path = route?.path ?? pathname;
  const version = getActiveVersion();

  return (
    <div className="mt-6 text-xs text-muted-foreground">
      {workflow} • {path} • {version}
    </div>
  );
}