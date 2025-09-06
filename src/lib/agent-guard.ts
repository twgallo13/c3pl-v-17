// V17.1.2 — agent guard
import { getActiveVersion, semverEq } from '@/lib/version';
import { logEvent } from '@/lib/build-log';

export function assertNoStuAndNo17_2() {
  const v = getActiveVersion();
  if (!semverEq(v, 'V17.1.2')) {
    const message = `Agent/feature blocked: active version ${v}. Only V17.1.2 allowed right now.`;
    
    logEvent({
      version: 'V17.1.2',
      module: 'agent-guard',
      action: 'version_violation',
      details: { current: v, expected: 'V17.1.2', reason: 'Stu/17.2 lockout active' }
    });
    
    throw new Error(message);
  }
  
  // add any runtime flags or environment checks that attempt to start Stu or 17.2 tasks
  // Check for any Stu-related flags in environment or window object
  if (typeof window !== 'undefined') {
    const global = window as any;
    if (global.stu || global.stuActive || global.delegateToStu) {
      logEvent({
        version: 'V17.1.2',
        module: 'agent-guard',
        action: 'stu_blocked',
        details: { reason: 'Stu delegation blocked during V17.1.2' }
      });
      throw new Error('Stu delegation blocked: Only V17.1.2 allowed');
    }
  }
}

// Call this at startup to enforce version lock
export function initializeVersionLock() {
  assertNoStuAndNo17_2();
  
  logEvent({
    version: 'V17.1.2',
    module: 'agent-guard',
    action: 'version_lock_initialized',
    details: { activeVersion: getActiveVersion() }
  });
}