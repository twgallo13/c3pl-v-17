// V17.1.2 — RBAC logic
export type Role = 'Vendor'|'AccountManager'|'CustomerService'|'Operations'|'Finance'|'Admin';

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