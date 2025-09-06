// V17.1.2-p8 — explicit route registry (Dashboards Home + Finance/RMA)
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

const DashboardsHome = React.lazy(() => import('@/components/dashboards/home'));

export const ROUTES = [
  { path: '/dashboards',      title: 'Dashboards',         workflow: 'Dashboards', visible: true,  component: DashboardsHome },
  { path: '/finance',         title: 'Finance Dashboard',  workflow: 'Finance',    roles: ['Finance','Admin'],    visible: true, component: React.lazy(() => import('@/components/finance-dashboard')) },
  { path: '/rma/adjustments', title: 'RMA Adjustments',    workflow: 'RMA',        roles: ['Operations','Admin'], visible: true, component: React.lazy(() => import('@/components/rma-adjustments-view')) },
  { path: '/admin/sitemap',   title: 'Sitemap',            workflow: 'Admin',      roles: ['Admin'],              visible: false, component: React.lazy(() => import('@/components/admin/sitemap')) },
] as const;