// V17.1.2-p4 — feature flags
export const releaseMode =
  (import.meta as any).env?.VITE_RELEASE_MODE === '1' ||
  (globalThis as any).__RELEASE__ === true;

export function allowDebug(): boolean {
  // Debugger only when NOT in release and explicitly requested
  if (releaseMode) return false;
  const qs = new URLSearchParams(globalThis.location?.search || '');
  return qs.has('debug') ||
         globalThis.localStorage?.getItem('debug') === '1' ||
         (import.meta as any).env?.VITE_FORCE_DEBUG === '1';
}