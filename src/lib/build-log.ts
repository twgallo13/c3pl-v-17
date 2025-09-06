// V17.1.2-rma-sync-hotfix — unified build-log stubs (no-op console)

export type BuildEvent = {
  version: string;
  module: string;
  action: string;
  details?: Record<string, unknown>;
  actor?: string;
};

export function logEvent(e: BuildEvent): void {
  try {
    console.info('[build-log]', e.version, e.module, e.action, e.details ?? {});
  } catch {}
}

// Back-compat shim for older callers
export function logRMAEvent(arg: any): void {
  const { version = 'V17.1.2', action = 'rma_event', module = 'rma', ...rest } = arg || {};
  logEvent({ version, module, action, details: rest });
}

// Minimal compatibility helpers (some code may import these)
export type BuildLogCallable = (action: string, details?: Record<string, unknown>) => void;

export function buildLogFor(version: string, module: string): BuildLogCallable {
  return (action, details) => logEvent({ version, module, action, details });
}

// Alias often used in code as a tag-style logger
export function stamp(version: string, module: string): BuildLogCallable {
  return buildLogFor(version, module);
}

// Required by transition-checklist imports
export const BUILD_LOG_V17_1_2 = 'V17.1.2';
