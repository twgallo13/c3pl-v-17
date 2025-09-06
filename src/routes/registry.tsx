// V17.1.2-p4e — explicit route registry (no duplicates)
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

const FinanceDashboard = React.lazy(() => import('@/components/finance-dashboard'));
const RmaAdjustments   = React.lazy(() => import('@/components/rma-adjustments-view'));
const TransitionChecklist = React.lazy(() => import('@/components/transition-checklist'));

export const ROUTES: RouteDef[] = [
  // Keep ONLY /finance visible (no '/' here)
  { path: '/finance',         title: 'Finance Dashboard', workflow: 'Finance', roles: ['Finance','Admin'], visible: true,  component: FinanceDashboard },
  { path: '/rma/adjustments', title: 'RMA Adjustments',   workflow: 'RMA',     roles: ['Operations','Admin'], visible: true,  component: RmaAdjustments },
  { path: '/admin/transition',title: 'Transition Checklist', workflow: 'Admin', roles: ['Admin'],           visible: false, component: TransitionChecklist },
];