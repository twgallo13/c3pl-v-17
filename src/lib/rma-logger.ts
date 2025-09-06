/**
 * C3PL V17.1.3 RMA Logging Adapter
 * Domain-specific wrapper around core build-log functions
 */

import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.1.3', 'rma');

export type RmaLogDetails = Record<string, unknown>;

export function logRMAEvent(action: string, details?: RmaLogDetails) {
  // Convenience wrapper so existing call sites remain stable
  tag(action, details);
  // Explicit structured event for stream filters
  logEvent({ version: 'V17.1.3', module: 'rma', action, details });
}

// Legacy compatibility for existing signature
export function logRMAEventLegacy(
  rmaId: string,
  action: string,
  actor: string,
  details?: RmaLogDetails
) {
  logEvent({ 
    version: 'V17.1.3', 
    module: 'rma', 
    action, 
    details: { rmaId, ...details }, 
    actor 
  });
}