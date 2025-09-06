/**
 * C3PL V17.1.3 Role-Based Access Control - Core Logic
 * Server-side and client route guards for secure feature access
 * Pure TypeScript logic - no JSX components
 */

import { UserRole } from "./types";
import { logEvent, versionGate } from "./build-log";

export interface RBACRule {
  roles: UserRole[];
  module: string;
  action: string;
  version?: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRoles?: UserRole[];
}

// Finance Access Rules (V17.1.3)
export const FINANCE_ACCESS_RULES: Record<string, RBACRule> = {
  "finance:dashboard": {
    roles: ["Finance", "Admin"],
    module: "finance",
    action: "dashboard",
    version: "V17.1.3"
  },
  "finance:gl_post": {
    roles: ["Finance", "Admin"],
    module: "finance",
    action: "gl_post",
    version: "V17.1.3"
  },
  "finance:payment_record": {
    roles: ["Finance", "Admin"],
    module: "finance",
    action: "payment_record",
    version: "V17.1.3"
  },
  "finance:export_parity": {
    roles: ["Finance", "Admin"],
    module: "finance",
    action: "export_parity",
    version: "V17.1.3"
  },
  "finance:rma_adjustments": {
    roles: ["Finance", "Admin"],
    module: "finance",
    action: "rma_adjustments",
    version: "V17.1.3"
  }
};

// RMA Access Rules
export const RMA_ACCESS_RULES: Record<string, RBACRule> = {
  "rma:create": {
    roles: ["Associate", "Manager"],
    module: "rma",
    action: "create",
    version: "V17.1.2"
  },
  "rma:view": {
    roles: ["Associate", "Manager", "Finance", "Admin"],
    module: "rma", 
    action: "view",
    version: "V17.1.2"
  },
  "rma:disposition": {
    roles: ["Manager", "Finance", "Admin"],
    module: "rma",
    action: "disposition",
    version: "V17.1.2"
  },
  "rma:approve": {
    roles: ["Manager", "Finance", "Admin"],
    module: "rma",
    action: "approve",
    version: "V17.1.2"
  },
  "rma:finance_view": {
    roles: ["Finance", "Admin"],
    module: "rma",
    action: "finance_view", 
    version: "V17.1.2"
  },
  "rma:vendor_portal": {
    roles: ["Vendor"],
    module: "rma",
    action: "vendor_portal",
    version: "V17.1.2"
  }
};

// Invoice Access Rules (existing, updated for V17.1.3)
export const INVOICE_ACCESS_RULES: Record<string, RBACRule> = {
  "invoice:create": {
    roles: ["Finance", "Admin"],
    module: "invoice",
    action: "create"
  },
  "invoice:edit": {
    roles: ["Finance", "Admin"],
    module: "invoice", 
    action: "edit"
  },
  "invoice:view": {
    roles: ["Finance", "Admin", "Vendor"],
    module: "invoice",
    action: "view"
  },
  "invoice:export": {
    roles: ["Finance", "Admin", "Vendor"],
    module: "invoice",
    action: "export"
  },
  "invoice:issue": {
    roles: ["Finance", "Admin"],
    module: "invoice",
    action: "issue",
    version: "V17.1.3"
  },
  "invoice:void": {
    roles: ["Finance", "Admin"],
    module: "invoice",
    action: "void",
    version: "V17.1.3"
  },
  "invoice:pay": {
    roles: ["Finance", "Admin"],
    module: "invoice",
    action: "pay",
    version: "V17.1.3"
  }
};

// WMS Access Rules (existing, updated for V17.1.2)
export const WMS_ACCESS_RULES: Record<string, RBACRule> = {
  "wms:receiving": {
    roles: ["Associate", "Manager", "Operations", "Admin"],
    module: "wms",
    action: "receiving"
  },
  "wms:wave_control": {
    roles: ["Manager", "Operations", "Admin"],
    module: "wms",
    action: "wave_control"
  },
  "wms:picking": {
    roles: ["Associate", "Manager", "Operations", "Admin"],
    module: "wms",
    action: "picking"
  },
  "wms:packout": {
    roles: ["Associate", "Manager", "Operations", "Admin"],
    module: "wms",
    action: "packout"
  }
};

export class RBACService {
  private static instance: RBACService;

  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  checkAccess(
    userRole: UserRole,
    permission: string,
    actor: string = "system"
  ): AccessCheckResult {
    // Get all rules
    const allRules = {
      ...FINANCE_ACCESS_RULES,
      ...RMA_ACCESS_RULES,
      ...INVOICE_ACCESS_RULES,
      ...WMS_ACCESS_RULES
    };

    const rule = allRules[permission];
    
    if (!rule) {
      logEvent({
        version: "V17.1.3",
        module: "rbac",
        action: "permission_not_found",
        details: { permission, userRole },
        actor
      });
      
      return {
        allowed: false,
        reason: "Permission not found"
      };
    }

    // Check version gate if specified
    if (rule.version && !versionGate(rule.version)) {
      return {
        allowed: false,
        reason: `Feature requires ${rule.version}`,
        requiredRoles: rule.roles
      };
    }

    const allowed = rule.roles.includes(userRole);
    
    logEvent({
      version: "V17.1.3",
      module: "rbac",
      action: allowed ? "access_granted" : "access_denied",
      details: { 
        permission, 
        userRole, 
        allowedRoles: rule.roles,
        module: rule.module 
      },
      actor
    });

    return {
      allowed,
      reason: allowed ? undefined : `Role ${userRole} not authorized`,
      requiredRoles: rule.roles
    };
  }

  // Server-side guard simulation
  serverGuard(
    userRole: UserRole,
    permission: string,
    actor: string
  ): boolean {
    const result = this.checkAccess(userRole, permission, actor);
    
    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }
    
    return true;
  }

  // Client route guard
  canAccessRoute(
    userRole: UserRole,
    route: string,
    actor: string = "client"
  ): boolean {
    const routePermissionMap: Record<string, string> = {
      "/finance-dashboard": "finance:dashboard",
      "/rma-adjustments": "finance:rma_adjustments",
      "/rma-intake": "rma:create",
      "/rma-manager": "rma:disposition", 
      "/rma-finance": "rma:finance_view",
      "/vendor-portal-rma": "rma:vendor_portal",
      "/invoices": "invoice:view",
      "/receiving": "wms:receiving",
      "/wave-control": "wms:wave_control",
      "/picking": "wms:picking",
      "/packout": "wms:packout"
    };

    const permission = routePermissionMap[route];
    if (!permission) {
      return true; // Allow access to unmapped routes
    }

    const result = this.checkAccess(userRole, permission, actor);
    return result.allowed;
  }

  // Get available features for a role
  getAvailableFeatures(userRole: UserRole): string[] {
    const allRules = {
      ...FINANCE_ACCESS_RULES,
      ...RMA_ACCESS_RULES,
      ...INVOICE_ACCESS_RULES, 
      ...WMS_ACCESS_RULES
    };

    return Object.entries(allRules)
      .filter(([_, rule]) => rule.roles.includes(userRole))
      .map(([permission, _]) => permission);
  }
}

export const rbacService = RBACService.getInstance();

// Convenience function for components
export function useRBAC(userRole: UserRole, permission: string, actor?: string): AccessCheckResult {
  return rbacService.checkAccess(userRole, permission, actor);
}