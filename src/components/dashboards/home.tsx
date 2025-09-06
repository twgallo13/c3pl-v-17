// V17.1.2-p4 — dashboards landing
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, DollarSign, FileText, Database } from '@phosphor-icons/react';

export default function DashboardsHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboards</h1>
        <p className="text-muted-foreground">Access key operational views and tools</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              KPIs & AR aging, receipts and reconciliation.
            </p>
            <Link 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline" 
              to="/finance"
            >
              Open Finance Dashboard →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Payment processing, reconciliation, and dunning.
            </p>
            <Link 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline" 
              to="/finance/payments"
            >
              Open Payments Console →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RMA</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Adjustments, credit memos, and reporting.
            </p>
            <Link 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline" 
              to="/rma/adjustments"
            >
              Open RMA Adjustments →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Quote generation and comparison tools.
            </p>
            <Link 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline" 
              to="/sales/quotes"
            >
              Open Quote Generator →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Benchmarks import and system configuration.
            </p>
            <Link 
              className="inline-flex items-center text-sm font-medium text-primary hover:underline" 
              to="/admin/benchmarks"
            >
              Open Benchmarks Import →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}