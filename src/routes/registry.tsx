// V17.1.2-p9a — registry: Dashboards + Finance + RMA (safe)

import React from 'react';
import type { Role } from '@/lib/role-store';
import type { VersionTag } from '@/lib/version';

export type RouteDef = {
  path: string;
  title: string;
  workflow: 'Dashboards' | 'Finance' | 'RMA' | 'Sales' | 'Admin';
  roles?: Role[];
  version?: VersionTag;
  visible?: boolean;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
};

// lazy imports (paths must match actual filenames)
const DashboardsHome   = React.lazy(() => import('@/components/dashboards/home'));
const FinanceDashboard = React.lazy(() => import('@/components/finance-dashboard-simple'));
const PaymentsConsole  = React.lazy(() => import('@/components/payments-console-placeholder'));
const RmaIntake        = React.lazy(() => import('@/components/rma-intake-placeholder'));
const RmaAdjustments   = React.lazy(() => import('@/components/rma-adjustments'));
const AdminSitemap     = React.lazy(() => import('@/components/admin/sitemap'));

export const ROUTES: RouteDef[] = [
  { path: '/dashboards',      title: 'Dashboards',         workflow: 'Dashboards',                          visible: true,  component: DashboardsHome },
  { path: '/finance',         title: 'Finance Dashboard',  workflow: 'Finance',    roles: ['Finance','Admin'], visible: true,  component: FinanceDashboard },
  { path: '/finance/payments',title: 'Payments Console',   workflow: 'Finance',    roles: ['Finance','Admin'], visible: true,  component: PaymentsConsole },
  { path: '/rma/intake',      title: 'RMA Intake',         workflow: 'RMA',        roles: ['Operations','Admin'], visible: true,  component: RmaIntake },
  { path: '/rma/adjustments', title: 'RMA Adjustments',    workflow: 'RMA',        roles: ['Operations','Admin'], visible: true,  component: RmaAdjustments },
  { path: '/admin/sitemap',   title: 'Sitemap',            workflow: 'Admin',      roles: ['Admin'],            visible: false, component: AdminSitemap },
];