// V17.1.2-p2 — RBAC UI gate (TSX)
import React from 'react';
import { checkAccess, type Role } from '@/lib/rbac';
import { logEvent } from '@/lib/build-log';
import { getActiveVersion } from '@/lib/version';
import { getRole, subscribe } from '@/lib/role-store';

type Props = {
  userRoles?: Array<string | Role>; // Optional - defaults to current role from store
  requiredRoles?: Role[];
  children: React.ReactNode;
};

export function RbacGate({ userRoles, requiredRoles = [], children }: Props) {
  const [currentRole, setCurrentRole] = React.useState<Role>(getRole());
  
  // Subscribe to role changes
  React.useEffect(() => subscribe(setCurrentRole), []);
  
  // Use provided roles or fall back to current role from store
  const rolesToCheck = userRoles || [currentRole];
  const access = checkAccess(rolesToCheck, requiredRoles);

  if (!access.allowed) {
    logEvent({
      version: getActiveVersion(),
      module: 'rbac',
      action: 'access_denied',
      details: { userRoles: rolesToCheck, requiredRoles, reason: access.reason }
    });
    
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <h3 className="font-medium text-destructive">Access Denied</h3>
        <p className="text-sm text-destructive/80 mt-1">{access.reason}</p>
        {access.requiredRoles?.length ? (
          <p className="text-xs mt-2">Required: {access.requiredRoles.join(', ')}</p>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}