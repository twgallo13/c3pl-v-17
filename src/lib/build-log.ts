// V17.1.2-rma-sync-hotfix — unified build-log stubs (no-op console)
export type BuildEvent = {
  version: string;
  module: string;
  action: string;
  details?: Record<string, unknown>;
};

export function logEvent(e: BuildEvent): void {
  try {
    console.info("[build-log]", e.version, e.module, e.action, e.details ?? {});
  } catch {}
}

// Back-compat shims:
export function logRMAEvent(arg: any): void {
  const {
    version = "V17.1.2",
    action = "rma_event",
    module = "rma",
    ...rest
  } = arg || {};
  logEvent({ version, module, action, details: rest });
}
export const BUILD_LOG_V17_1_2 = "V17.1.2";
