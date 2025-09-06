// V17.1.2-p2 — release/debug flags
export const releaseMode =
  (import.meta as any).env?.VITE_RELEASE_MODE === '1' ||
  (globalThis as any).__RELEASE__ === true;

export const debugEnabled =
  !releaseMode &&
  (new URLSearchParams(globalThis.location?.search || '').has('debug') ||
   globalThis.localStorage?.getItem('debug') === '1');