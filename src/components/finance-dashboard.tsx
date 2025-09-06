/**
 * C3PL V17.1.2 Finance Dashboard - Hardened
 * AR Aging, Open Invoices, Recent GL Posts with filtering
 * V17.1.2 Patch: Safe guards, error boundary, null-safe maps/formatting
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Clock, Receipt, TrendingUp, Filter, Calendar } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';
import { logEvent, stamp } from '@/lib/build-log';
import { withErrorBoundary } from '@/components/error-boundary';
import { safeArr, safeNum, fmtCurrency, safeStr } from '@/lib/safe';
import { coerceInvoiceLite, type InvoiceLite } from '@/lib/schemas/finance';
import type { UserRole } from '@/lib/types';

const tag = stamp('V17.1.2', 'finance-dashboard');

interface FinanceDashboardProps {
  userRole: UserRole;
  onBack: () => void;
}

interface ARAgingData {
  range: string;
  count: number;
  amount: number;
}

interface GLPost {
  id: string;
  date: string;
  module: string;
  description: string;
  amount: number;
  journalId: string;
}

interface DashboardFilters {
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

function FinanceDashboardImpl({ userRole, onBack }: FinanceDashboardProps) {
  const [filters, setFilters] = useKV<DashboardFilters>('finance-dashboard-filters', {});
  const [arAging, setArAging] = useState<ARAgingData[]>([]);
  const [openInvoices, setOpenInvoices] = useState<InvoiceLite[]>([]);
  const [recentGLPosts, setRecentGLPosts] = useState<GLPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      tag('finance_dashboard_load_start');
      
      // Mock data - in real app, would fetch from APIs
      const mockARData: ARAgingData[] = [
        { range: '0-30 days', count: 15, amount: 45300.50 },
        { range: '31-60 days', count: 8, amount: 23100.75 },
        { range: '61-90 days', count: 3, amount: 8450.25 },
        { range: '>90 days', count: 2, amount: 12800.00 }
      ];

      const mockOpenInvoicesRaw: any[] = [
        {
          id: 'INV-001',
          client: 'Acme Corp',
          status: 'issued',
          balance: 1026,
          gl_journal_id: 'GL-001'
        },
        {
          id: 'INV-002',
          client: 'Beta LLC',
          status: 'issued',
          balance: 2592,
          gl_journal_id: 'GL-002'
        }
      ];

      const mockGLPosts: GLPost[] = [
        {
          id: 'GL-003',
          date: '2024-01-16',
          module: 'billing',
          description: 'Invoice INV-003 issued',
          amount: 1550.00,
          journalId: 'GL-003'
        },
        {
          id: 'GL-004',
          date: '2024-01-16',
          module: 'payments',
          description: 'Payment received - INV-001',
          amount: 1026.00,
          journalId: 'GL-004'
        },
        {
          id: 'GL-005',
          date: '2024-01-15',
          module: 'rma',
          description: 'RMA credit memo - RMA-001',
          amount: 250.00,
          journalId: 'GL-005'
        }
      ];

      // Safe data coercion
      const safeOpenInvoices = safeArr(mockOpenInvoicesRaw).map(coerceInvoiceLite);

      setArAging(safeArr(mockARData));
      setOpenInvoices(safeOpenInvoices);
      setRecentGLPosts(safeArr(mockGLPosts));

      tag('finance_dashboard_load_success', {
        arAgingRanges: mockARData.length,
        openInvoicesCount: safeOpenInvoices.length,
        recentGLPostsCount: mockGLPosts.length,
        filters
      });

    } catch (error) {
      logEvent({ 
        version: 'V17.1.2', 
        module: 'finance-dashboard', 
        action: 'finance_dashboard_load_error', 
        details: { message: String(error) }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const calculateTotalAR = () => safeArr(arAging).reduce((sum, range) => sum + safeNum(range?.amount, 0), 0);
  const getTotalOpenInvoices = () => safeArr(openInvoices).reduce((sum, inv) => sum + safeNum(inv?.balance, 0), 0);
  const getRecentGLTotal = () => safeArr(recentGLPosts).reduce((sum, post) => sum + safeNum(post?.amount, 0), 0);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'issued': return 'default';
      case 'paid': return 'default';
      case 'void': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Finance Dashboard - V17.1.2</h1>
          </div>
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Finance Dashboard</h1>
            <p className="text-muted-foreground">V17.1.2 - AR Aging, Open Invoices, GL Activity</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Client</label>
                <Input
                  placeholder="Client ID or name"
                  value={filters.clientId || ''}
                  onChange={(e) => handleFilterChange('clientId', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total AR</p>
                  <p className="text-2xl font-bold">{fmtCurrency(calculateTotalAR())}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Invoices</p>
                  <p className="text-2xl font-bold">{fmtCurrency(getTotalOpenInvoices())}</p>
                  <p className="text-xs text-muted-foreground">{safeArr(openInvoices).length} invoices</p>
                </div>
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent GL Activity</p>
                  <p className="text-2xl font-bold">{fmtCurrency(getRecentGLTotal())}</p>
                  <p className="text-xs text-muted-foreground">{safeArr(recentGLPosts).length} entries</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                  <p className="text-2xl font-bold text-destructive">
                    {fmtCurrency(safeArr(arAging).find(r => r.range === '>90 days')?.amount || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {safeArr(arAging).find(r => r.range === '>90 days')?.count || 0} invoices
                  </p>
                </div>
                <Clock className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AR Aging */}
        <Card>
          <CardHeader>
            <CardTitle>AR Aging Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any bucket to view filtered invoices
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeArr(arAging).map((range) => (
                <Button
                  key={range.range}
                  variant="ghost"
                  className="w-full h-auto p-4 justify-between hover:bg-muted/50"
                  onClick={() => {
                    // In real app, this would navigate to filtered invoice list
                    tag('ar_aging_bucket_clicked', {
                      bucket: range.range,
                      count: range.count,
                      amount: range.amount
                    });
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{safeStr(range.range)}</p>
                    <p className="text-sm text-muted-foreground">{safeNum(range.count)} invoices</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{fmtCurrency(range.amount)}</p>
                    <div className="w-32 bg-secondary rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (safeNum(range.amount) / calculateTotalAR()) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Outstanding</span>
                <span className="font-bold text-xl">{fmtCurrency(calculateTotalAR())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Open Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Open Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeArr(openInvoices).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{safeStr(invoice.id)}</p>
                      <p className="text-sm text-muted-foreground">{safeStr(invoice.client)}</p>
                      <p className="text-xs text-muted-foreground">Status: {safeStr(invoice.status)}</p>
                      {invoice.gl_journal_id && (
                        <p className="text-xs text-muted-foreground">GL: {safeStr(invoice.gl_journal_id)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{fmtCurrency(invoice.balance)}</p>
                      <Badge variant={getStatusBadgeVariant(safeStr(invoice.status))}>
                        {safeStr(invoice.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent GL Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent GL Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {safeArr(recentGLPosts).map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{safeStr(post.description)}</p>
                      <p className="text-sm text-muted-foreground">{safeStr(post.module)}</p>
                      <p className="text-xs text-muted-foreground">{safeStr(post.date)}</p>
                      <p className="text-xs text-muted-foreground">Journal: {safeStr(post.journalId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{fmtCurrency(post.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const FinanceDashboard = withErrorBoundary(FinanceDashboardImpl, { 
  module: 'finance', 
  component: 'finance-dashboard' 
});

export default FinanceDashboard;