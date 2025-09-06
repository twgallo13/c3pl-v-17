// V17.1.2-p4 — explicit route registry
import React from 'react';
import type { Role } from '@/lib/role-store';
import type { VersionTag } from '@/lib/version';
import { allowDebug } from '@/lib/feature-flags';

export type RouteDef = {
  path: string;
  title: string;
  workflow: 'Dashboards'|'Finance'|'RMA'|'Sales'|'Admin';
  roles?: Role[];
  version?: VersionTag;
  visible?: boolean; // sidebar visibility
  component: React.LazyExoticComponent<React.ComponentType<any>>;
};

const DashboardsHome = React.lazy(() => import('@/components/dashboards/home'));
const FinanceDashboard = React.lazy(() => import('@/components/finance-dashboard'));
const RmaAdjustments = React.lazy(() => import('@/components/rma-adjustments-view'));
const PaymentsConsole = React.lazy(() => import('@/components/payments-console'));
const QuoteGenerator = React.lazy(() => import('@/components/quote-generator'));
const BenchmarksImport = React.lazy(() => import('@/components/benchmarks-import'));

// Hidden admin utilities (not visible in sidebar)
const TransitionChecklist = React.lazy(() => import('@/components/transition-checklist'));

// Debugger route only included if allowDebug() === true
const DebuggerPanel = React.lazy(() => import('@/components/debugger-panel'));

export const ROUTES: RouteDef[] = [
  { path: '/', title: 'Dashboards', workflow: 'Dashboards', visible: true, component: DashboardsHome },
  { path: '/finance', title: 'Finance Dashboard', workflow: 'Finance', roles: ['Finance','Admin'], visible: true, component: FinanceDashboard },
  { path: '/finance/payments', title: 'Payments Console', workflow: 'Finance', roles: ['Finance','Admin'], visible: true, component: PaymentsConsole },
  { path: '/rma/adjustments', title: 'RMA Adjustments', workflow: 'RMA', roles: ['Operations','Admin'], visible: true, component: RmaAdjustments },
  { path: '/sales/quotes', title: 'Quote Generator', workflow: 'Sales', roles: ['AccountManager','Admin'], visible: true, component: QuoteGenerator },
  { path: '/admin/benchmarks', title: 'Benchmarks Import', workflow: 'Admin', roles: ['Admin'], visible: true, component: BenchmarksImport },
  { path: '/admin/transition', title: 'Transition Checklist', workflow: 'Admin', roles: ['Admin'], visible: false, component: TransitionChecklist },
  ...(allowDebug() ? [{ path: '/admin/debug', title: 'Debugger', workflow: 'Admin', roles: ['Admin'], visible: false, component: DebuggerPanel } as RouteDef] : [])
];