// V17.1.2-p8f5c — simple role store with subscribe
export type Role = 'Admin' | 'Finance' | 'Operations' | 'CustomerService' | 'Vendor';

const KEY = 'c3pl_role';
const ALL: Role[] = ['Admin', 'Finance', 'Operations', 'CustomerService', 'Vendor'];

let current: Role = 'Admin';
try {
  if (typeof window !== 'undefined') {
    const v = window.localStorage.getItem(KEY);
    if (v && (ALL as string[]).includes(v)) current = v as Role;
  }
} catch {}

const subs = new Set<(r: Role) => void>();

export function getRole(): Role {
  return current;
}

export function setRole(r: Role) {
  current = r;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, r);
  } catch {}
  subs.forEach((fn) => fn(r));
}

export function subscribe(fn: (r: Role) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}
