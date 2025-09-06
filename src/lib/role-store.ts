// V17.1.2-p2 — shared role store for Role Switcher
import { logEvent } from '@/lib/build-log';
import { getActiveVersion } from '@/lib/version';

export type Role = 'Vendor' | 'AccountManager' | 'CustomerService' | 'Operations' | 'Finance' | 'Admin';

// Map to UserRole from types.ts for compatibility
export type UserRole = "Vendor" | "Account Manager" | "Customer Service" | "Operations" | "Admin" | "Finance" | "Associate" | "Manager";

// In-memory store with localStorage persistence
let _current: Role = 'Admin';
const _subscribers = new Set<(role: Role) => void>();

// Initialize from storage on module load
try {
  const stored = globalThis.localStorage?.getItem('c3pl-current-role');
  if (stored && isValidRole(stored)) {
    _current = stored as Role;
  }
} catch {}

function isValidRole(value: string): value is Role {
  return ['Vendor', 'AccountManager', 'CustomerService', 'Operations', 'Finance', 'Admin'].includes(value);
}

// Convert from UserRole (with spaces) to internal Role (no spaces)
function normalizeToRole(userRole: UserRole): Role {
  const roleMap: Record<UserRole, Role> = {
    'Vendor': 'Vendor',
    'Account Manager': 'AccountManager',
    'Customer Service': 'CustomerService',
    'Operations': 'Operations',
    'Admin': 'Admin',
    'Finance': 'Finance',
    'Associate': 'Operations', // Map Associate to Operations 
    'Manager': 'Operations',   // Map Manager to Operations
  };
  return roleMap[userRole] || 'Admin';
}

// Convert from internal Role to UserRole for display
function roleToUserRole(role: Role): UserRole {
  const userRoleMap: Record<Role, UserRole> = {
    'Vendor': 'Vendor',
    'AccountManager': 'Account Manager',
    'CustomerService': 'Customer Service',
    'Operations': 'Operations',
    'Admin': 'Admin',
    'Finance': 'Finance',
  };
  return userRoleMap[role] || 'Admin';
}

export function getRole(): Role {
  return _current;
}

export function getCurrentUserRole(): UserRole {
  return roleToUserRole(_current);
}

export function setRole(role: Role | UserRole): void {
  const normalizedRole = typeof role === 'string' && role.includes(' ') 
    ? normalizeToRole(role as UserRole) 
    : role as Role;
    
  if (_current !== normalizedRole) {
    const previous = _current;
    _current = normalizedRole;
    
    // Persist to localStorage
    try {
      globalThis.localStorage?.setItem('c3pl-current-role', normalizedRole);
    } catch {}
    
    // Log role change
    logEvent({
      version: getActiveVersion(),
      module: 'rbac',
      action: 'role_switched',
      details: { from: previous, to: normalizedRole },
    });
    
    // Notify subscribers
    _subscribers.forEach(fn => fn(normalizedRole));
  }
}

export function subscribe(callback: (role: Role) => void): () => void {
  _subscribers.add(callback);
  return () => _subscribers.delete(callback);
}