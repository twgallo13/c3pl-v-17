// V17.1.2-p5a — explicit route registry (adds Admin Sitemap)
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

const DashboardsHome      = React.lazy(() => import('@/components/dashboards/home'));
const FinanceDashboard    = React.lazy(() => import('@/components/finance-dashboard'));
const RmaAdjustments      = React.lazy(() => import('@/components/rma-adjustments'));
const TransitionChecklist = React.lazy(() => import('@/components/transition-checklist'));
const AdminSitemap        = React.lazy(() => import('@/components/admin/sitemap'));

export const ROUTES: RouteDef[] = [
  { path: '/dashboards',       title: 'Dashboards',          workflow: 'Dashboards', visible: true,  component: DashboardsHome },
  { path: '/finance',          title: 'Finance Dashboard',   workflow: 'Finance',    roles: ['Finance','Admin'], visible: true,  component: FinanceDashboard },
  { path: '/rma/adjustments',  title: 'RMA Adjustments',     workflow: 'RMA',        roles: ['Operations','Admin'], visible: true,  component: RmaAdjustments },
  { path: '/admin/sitemap',    title: 'Sitemap',             workflow: 'Admin',      roles: ['Admin'], visible: true,  component: AdminSitemap },
  { path: '/admin/transition', title: 'Transition Checklist',workflow: 'Admin',      roles: ['Admin'], visible: false, component: TransitionChecklist },
];