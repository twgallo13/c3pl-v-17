// V17.1.2-p2 — RBAC logic
import { logEvent } from '@/lib/build-log';
import { getActiveVersion } from '@/lib/version';
import { getRole } from '@/lib/role-store';

export type Role = 'Vendor'|'AccountManager'|'CustomerService'|'Operations'|'Finance'|'Admin';

// Map UserRole from types.ts to our normalized Role type
export type UserRole = "Vendor" | "Account Manager" | "Customer Service" | "Operations" | "Admin" | "Finance" | "Associate" | "Manager";

function norm(r: string): Role | null {
  const map: Record<string, Role> = {
    vendor: 'Vendor',
    accountmanager: 'AccountManager',
    'account manager': 'AccountManager',
    customerservice: 'CustomerService',
    'customer service': 'CustomerService',
    ops: 'Operations',
    operations: 'Operations',
    finance: 'Finance',
    admin: 'Admin',
    associate: 'Operations', // Map Associate to Operations for WMS
    manager: 'Operations',   // Map Manager to Operations for WMS
  };
  return map[r.trim().toLowerCase()] ?? null;
}

export function normalizeRoles(input: Array<string | Role>): Role[] {
  const out = new Set<Role>();
  for (const r of input) {
    if (typeof r === 'string') {
      const n = norm(r);
      if (n) out.add(n);
    } else {
      out.add(r);
    }
  }
  return [...out];
}

export type AccessResult = { allowed: boolean; reason?: string; requiredRoles?: Role[] };
export type AccessCheckResult = AccessResult; // Alias for compatibility

export function checkAccess(userRoles: Array<string | Role>, required: Role[] = []): AccessResult {
  const roles = normalizeRoles(userRoles);
  if (!required.length) return { allowed: true };
  const allowed = required.some(req => roles.includes(req));
  return allowed
    ? { allowed: true }
    : { allowed: false, reason: `Required roles: ${required.join(', ')}`, requiredRoles: required };
}

// Validate user has specific role
export function hasRole(userRoles: Array<string | Role>, targetRole: Role): boolean {
  const roles = normalizeRoles(userRoles);
  return roles.includes(targetRole);
}

// Access denied error class
export class AccessDeniedError extends Error {
  details?: AccessResult;
  constructor(message: string, details?: AccessResult) {
    super(message);
    this.name = 'AccessDeniedError';
    this.details = details;
  }
}

// Permission-based access control mapping
const PERMISSION_ROLES: Record<string, Role[]> = {
  'rma:create': ['Operations', 'Admin'],
  'rma:disposition': ['Operations', 'Finance', 'Admin'],
  'rma:view': ['Operations', 'Finance', 'Admin', 'Vendor'],
  'finance:invoices': ['Finance', 'Admin'],
  'finance:payments': ['Finance', 'Admin'],
  'finance:reports': ['Finance', 'Admin', 'AccountManager'],
  'wms:receiving': ['Operations', 'Admin'],
  'wms:picking': ['Operations', 'Admin'],
  'wms:packout': ['Operations', 'Admin'],
  'admin:users': ['Admin'],
  'admin:benchmarks': ['Admin'],
  'vendor:readonly': ['Vendor', 'AccountManager', 'CustomerService', 'Operations', 'Finance', 'Admin'],
};

// Route-based access control
const ROUTE_ROLES: Record<string, Role[]> = {
  '/rma-finance': ['Finance', 'Admin'],
  '/rma-manager': ['Operations', 'Admin'],
  '/rma-intake': ['Operations', 'Admin'],
  '/finance-dashboard': ['Finance', 'Admin'],
  '/payments-console': ['Finance', 'Admin'],
  '/benchmarks-import': ['Admin'],
  '/vendor-portal-rma': ['Vendor', 'AccountManager', 'CustomerService', 'Operations', 'Finance', 'Admin'],
};

// Feature-based access control
const FEATURE_SETS: Record<Role, string[]> = {
  Admin: ['rma:all', 'finance:all', 'wms:all', 'admin:all', 'vendor:all'],
  Finance: ['rma:view', 'rma:disposition', 'finance:all'],
  Operations: ['rma:all', 'wms:all'],
  AccountManager: ['rma:view', 'finance:reports', 'vendor:readonly'],
  CustomerService: ['rma:view', 'vendor:readonly'],
  Vendor: ['vendor:readonly'],
};

// ---- rbacService export ----
export const rbacService = {
  /** Get current active role from role store */
  current(): Role {
    return getRole();
  },

  /** Check access for a user role against a permission */
  checkAccess(userRole: UserRole, permission: string, actor?: string): AccessResult {
    const normalizedRole = norm(userRole);
    if (!normalizedRole) {
      const result = { allowed: false, reason: `Invalid role: ${userRole}` };
      this.logAccessAttempt(userRole, permission, actor, result);
      return result;
    }

    const requiredRoles = PERMISSION_ROLES[permission];
    if (!requiredRoles) {
      const result = { allowed: false, reason: `Unknown permission: ${permission}` };
      this.logAccessAttempt(userRole, permission, actor, result);
      return result;
    }

    const result = checkAccess([normalizedRole], requiredRoles);
    this.logAccessAttempt(userRole, permission, actor, result);
    return result;
  },

  /** Server-side guard that throws on access denial */
  serverGuard(userRole: UserRole, permission: string, actor?: string): void {
    const result = this.checkAccess(userRole, permission, actor);
    if (!result.allowed) {
      logEvent({
        version: getActiveVersion(),
        module: 'rbac',
        action: 'access_denied',
        details: { userRole, permission, actor, reason: result.reason },
      });
      throw new AccessDeniedError(result.reason ?? 'Access denied', result);
    }
  },

  /** Check if a user can access a specific route */
  canAccessRoute(userRole: UserRole, route: string, actor?: string): boolean {
    const normalizedRole = norm(userRole);
    if (!normalizedRole) return false;

    const requiredRoles = ROUTE_ROLES[route];
    if (!requiredRoles) return false;

    const result = checkAccess([normalizedRole], requiredRoles);
    this.logAccessAttempt(userRole, `route:${route}`, actor, result);
    return result.allowed;
  },

  /** Get available features for a user role */
  getAvailableFeatures(userRole: UserRole): string[] {
    const normalizedRole = norm(userRole);
    if (!normalizedRole) return [];

    return FEATURE_SETS[normalizedRole] ?? [];
  },

  /** Helper to log access attempts */
  logAccessAttempt(userRole: UserRole, permission: string, actor?: string, result?: AccessResult): void {
    logEvent({
      version: getActiveVersion(),
      module: 'rbac',
      action: result?.allowed ? 'access_granted' : 'access_denied',
      details: { userRole, permission, actor, reason: result?.reason },
    });
  },
};