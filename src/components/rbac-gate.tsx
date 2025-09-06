/**
 * C3PL V17.1.2 RBAC UI Gate Component
 * React components for role-based access control UI
 */

import React from 'react';
import { rbacService, type UserRole, type AccessCheckResult } from '@/lib/rbac';
import { logEvent, stamp } from '@/lib/build-log';

interface RBACGateProps {
  userRole: UserRole;
  permission: string;
  actor?: string;
  children: React.ReactNode;
}

const tag = stamp('V17.1.2', 'rbac');

/**
 * RBAC Gate Component - Conditionally renders children based on user permissions
 */
export function RBACGate({ userRole, permission, actor = "component", children }: RBACGateProps) {
  const access = rbacService.checkAccess(userRole, permission, actor);

  if (!access.allowed) {
    tag('access_denied', { 
      userRole, 
      permission, 
      reason: access.reason,
      requiredRoles: access.requiredRoles 
    });
    
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <h3 className="font-medium text-destructive">Access Denied</h3>
        <p className="text-sm text-destructive/80 mt-1">{access.reason}</p>
        {access.requiredRoles && (
          <p className="text-xs text-muted-foreground mt-2">
            Required roles: {access.requiredRoles.join(", ")}
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for RBAC protection
 */
export function withRBACGuard<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  permission: string
) {
  return function GuardedComponent(props: T & { userRole: UserRole, actor?: string }) {
    const { userRole, actor = "component", ...componentProps } = props;
    
    return (
      <RBACGate userRole={userRole} permission={permission} actor={actor}>
        <Component {...(componentProps as T)} />
      </RBACGate>
    );
  };
}

/**
 * Hook for checking RBAC permissions in components
 */
export function useRBACCheck(userRole: UserRole, permission: string, actor?: string): AccessCheckResult {
  return rbacService.checkAccess(userRole, permission, actor);
}

export default RBACGate;