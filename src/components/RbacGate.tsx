// V17.1.2 — RBAC UI gate (TSX)
import React from 'react';
import { checkAccess, type Role } from '@/lib/rbac';
import { logEvent } from '@/lib/build-log';
import { getActiveVersion } from '@/lib/version';

type Props = {
  userRoles: Array<string | Role>;
  requiredRoles?: Role[];
  children: React.ReactNode;
};

export function RbacGate({ userRoles, requiredRoles = [], children }: Props) {
  const access = checkAccess(userRoles, requiredRoles);

  if (!access.allowed) {
    logEvent({
      version: getActiveVersion(),
      module: 'rbac',
      action: 'access_denied',
      details: { userRoles, requiredRoles, reason: access.reason }
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