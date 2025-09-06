// V17.1.2-p3e — agent guard (accept patch builds)
import { getActiveVersion, sameCore } from '@/lib/version';
import { logEvent } from '@/lib/build-log';

export function assertNoStuAndNo17_2() {
  const v = getActiveVersion();

  // Allow any V17.1.2-pN (match core only)
  if (!sameCore(v, 'V17.1.2')) {
    const message = `Agent/feature blocked: active version ${v}. Only V17.1.2 (including -pN) allowed right now.`;
    logEvent({
      version: v,
      module: 'agent-guard',
      action: 'version_violation',
      details: { current: v, expectedCore: 'V17.1.2', reason: 'Stu/17.2 lockout active' }
    });
    throw new Error(message);
  }

  // Block any attempt to delegate to Stu while 17.1.2 core is active
  if (typeof window !== 'undefined') {
    const global = window as any;
    if (global.stu || global.stuActive || global.delegateToStu) {
      logEvent({
        version: v,
        module: 'agent-guard',
        action: 'stu_blocked',
        details: { reason: 'Stu delegation blocked during V17.1.2 core' }
      });
      throw new Error('Stu delegation blocked: Only V17.1.2 core allowed');
    }
  }
}

// Call this at startup to enforce version lock
export function initializeVersionLock() {
  const v = getActiveVersion();
  assertNoStuAndNo17_2();
  logEvent({
    version: v,
    module: 'agent-guard',
    action: 'version_lock_initialized',
    details: { activeVersion: v }
  });
}
