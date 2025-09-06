// V17.1.2 — Quick verification that rbacService exports are working
import { rbacService } from '@/lib/rbac';

// Test basic functionality
console.log('[RBAC-SERVICE-TEST] Testing rbacService import...');

try {
  // Test checkAccess method
  const adminAccess = rbacService.checkAccess('Admin', 'rma:create', 'test-admin');
  console.log('[RBAC-SERVICE-TEST] Admin access:', adminAccess);

  // Test canAccessRoute method
  const adminRoute = rbacService.canAccessRoute('Admin', '/rma-finance', 'test-admin');
  console.log('[RBAC-SERVICE-TEST] Admin route access:', adminRoute);

  // Test getAvailableFeatures method
  const adminFeatures = rbacService.getAvailableFeatures('Admin');
  console.log('[RBAC-SERVICE-TEST] Admin features:', adminFeatures);

  console.log('[RBAC-SERVICE-TEST] ✅ All rbacService methods accessible - export fix successful!');
} catch (error) {
  console.error('[RBAC-SERVICE-TEST] ❌ Error accessing rbacService:', error);
}