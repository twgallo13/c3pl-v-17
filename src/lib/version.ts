// V17.1.2-p4 — version core
export type VersionTag = `V${number}.${number}.${number}` | `V${number}.${number}.${number}-p${number}` | `V${number}.${number}.${number}-p${number}${string}`;

// active version singleton (set on boot and read everywhere)
let _active: VersionTag = 'V17.1.2-p4';

export function setActiveVersion(v: VersionTag) {
  _active = v;
}

export function getActiveVersion(): VersionTag {
  return _active;
}

export function semverEq(a: VersionTag, b: VersionTag) {
  return a === b;
}

export function semverLte(a: VersionTag, b: VersionTag) {
  const pa = a.slice(1).split('.').map(Number);
  const pb = b.slice(1).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return true;
}

/** require version == expected by default (or <= if allowOlder is true) */
export function sameCore(a: VersionTag, b: VersionTag): boolean {
  // Extract core version (before any -p suffix)
  const coreA = a.split('-')[0];
  const coreB = b.split('-')[0];
  return coreA === coreB;
}

export function versionGate(expected: VersionTag, allowOlder = false): { ok: boolean; reason?: string } {
  const cur = getActiveVersion();
  const ok = allowOlder ? semverLte(cur, expected) : semverEq(cur, expected);
  return ok ? { ok } : { ok, reason: `Feature requires ${expected}, current ${cur}` };
}