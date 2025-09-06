// V17.1.2-p8f5c — minimal RBAC check
import type { Role } from './role-store';

export type { Role };

export function checkAccess(userRoles: Role[], allowed?: Role[]) {
  if (!allowed || allowed.length === 0) return { allowed: true as const };
  const ok = userRoles.some((r) => allowed.includes(r));
  return ok ? { allowed: true as const } : { allowed: false as const, reason: 'Access Denied' };
}
