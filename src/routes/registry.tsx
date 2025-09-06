// V17.1.2-p4c — explicit route registry (clean themed layout)

import React from 'react';
import type { Role } from '@/lib/role-store';
import type { VersionTag } from '@/lib/version';

export type RouteDef = {
  path: string;
  title: string;
  workflow: 'Dashboards' | 'Finance' | 'RMA' | 'Sales' | 'Admin';
  roles?: Role[];
  version?: VersionTag;
  visible?: boolean; // controls sidebar visibility
  component: React.LazyExoticComponent<React.ComponentType<any>>;
};

// Lazy pages that already exist
const FinanceDashboard = React.lazy(() => import('@/components/finance-dashboard'));
const RmaAdjustments = React.lazy(() => import('@/components/rma-adjustments-view'));
const TransitionChecklist = React.lazy(() => import('@/components/transition-checklist'));

// NOTE: No Debugger route here (kept out of the registry for release builds)

export const ROUTES: RouteDef[] = [
  // Temporary home is Finance (we can switch to a DashboardsHome later)
  { path: '/', title: 'Finance Dashboard', workflow: 'Finance', roles: ['Finance', 'Admin'], visible: true, component: FinanceDashboard },
  { path: '/finance', title: 'Finance Dashboard', workflow: 'Finance', roles: ['Finance', 'Admin'], visible: true, component: FinanceDashboard },
  { path: '/rma/adjustments', title: 'RMA Adjustments', workflow: 'RMA', roles: ['Operations', 'Admin'], visible: true, component: RmaAdjustments },
  { path: '/admin/transition', title: 'Transition Checklist', workflow: 'Admin', roles: ['Admin'], visible: false, component: TransitionChecklist },
];