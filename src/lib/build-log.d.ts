/**
 * C3PL V17.1.2 Build Log Type Definitions
 * Strict TypeScript declarations for logging utilities
 */

export interface BuildLogEvent {
  version: string;
  module: string;
  action: string;
  details?: unknown;
  actor?: string;
  at?: string;
}

export declare function logEvent(ev: BuildLogEvent): void;
export declare function logEventLegacy(
  level: "info" | "warn" | "error" | "debug",
  module: string,
  actor: string,
  message: string,
  details?: unknown
): void;
export declare function stamp(version: string, module: string): (action: string, details?: unknown, actor?: string) => void;
export declare function versionGate(requiredVersion: string): boolean;

export declare function logWMSEvent(
  level: "info" | "warn" | "error" | "debug",
  module: string,
  actor: string,
  message: string,
  entityId?: string,
  metadata?: Record<string, any>
): void;