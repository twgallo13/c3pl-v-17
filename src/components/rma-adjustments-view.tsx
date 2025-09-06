/**
 * C3PL V17.1.3 RMA Adjustments View
 * Enhanced view with Artifact Type, Amount, GL Journal ID, Posted At columns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RotateCcw, Filter, ExternalLink } from '@phosphor-icons/react';
import { logEvent, stamp } from '@/lib/build-log';
import type { UserRole } from '@/lib/types';

const tag = stamp('V17.1.3', 'rma-adjustments');

interface RMAAdjustmentsProps {
  userRole: UserRole;
  onBack: () => void;
}

interface RMAAdjustment {
  id: string;
  rmaId: string;
  rmaLineId: string;
  clientName: string;
  artifactType: 'credit_memo' | 'disposal_fee' | 'rtv_charge' | 'repair_invoice';
  amount: number;
  glJournalId?: string;
  postedAt?: string;
  status: 'pending' | 'posted' | 'error';
  createdAt: string;
  description: string;
}

interface AdjustmentFilters {
  clientName?: string;
  artifactType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function RMAAdjustmentsView({ userRole, onBack }: RMAAdjustmentsProps) {
  const [adjustments, setAdjustments] = useState<RMAAdjustment[]>([]);
  const [filters, setFilters] = useState<AdjustmentFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdjustments();
  }, [filters]);

  const loadAdjustments = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, would fetch from RMA service
      const mockAdjustments: RMAAdjustment[] = [
        {
          id: 'ADJ-001',
          rmaId: 'RMA-001',
          rmaLineId: 'RL-001',
          clientName: 'Acme Corp',
          artifactType: 'credit_memo',
          amount: 250.00,
          glJournalId: 'GL-006',
          postedAt: '2024-01-16T14:30:00Z',
          status: 'posted',
          createdAt: '2024-01-16T14:15:00Z',
          description: 'Credit memo for defective item return'
        },
        {
          id: 'ADJ-002',
          rmaId: 'RMA-002',
          rmaLineId: 'RL-002',
          clientName: 'Beta LLC',
          artifactType: 'disposal_fee',
          amount: 50.00,
          glJournalId: 'GL-007',
          postedAt: '2024-01-15T16:00:00Z',
          status: 'posted',
          createdAt: '2024-01-15T15:45:00Z',
          description: 'Disposal fee for damaged goods'
        },
        {
          id: 'ADJ-003',
          rmaId: 'RMA-003',
          rmaLineId: 'RL-003',
          clientName: 'Gamma Inc',
          artifactType: 'rtv_charge',
          amount: 100.00,
          glJournalId: 'GL-008',
          postedAt: '2024-01-14T11:20:00Z',
          status: 'posted',
          createdAt: '2024-01-14T11:05:00Z',
          description: 'Return to vendor processing charge'
        },
        {
          id: 'ADJ-004',
          rmaId: 'RMA-004',
          rmaLineId: 'RL-004',
          clientName: 'Delta Corp',
          artifactType: 'repair_invoice',
          amount: 150.00,
          status: 'pending',
          createdAt: '2024-01-16T09:30:00Z',
          description: 'Repair service for returned item'
        },
        {
          id: 'ADJ-005',
          rmaId: 'RMA-005',
          rmaLineId: 'RL-005',
          clientName: 'Echo Ltd',
          artifactType: 'credit_memo',
          amount: 75.00,
          status: 'error',
          createdAt: '2024-01-15T12:00:00Z',
          description: 'Credit memo - posting failed'
        }
      ];

      // Apply filters
      const filteredAdjustments = mockAdjustments.filter(adj => {
        if (filters.clientName && !adj.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) {
          return false;
        }
        if (filters.artifactType && adj.artifactType !== filters.artifactType) {
          return false;
        }
        if (filters.status && adj.status !== filters.status) {
          return false;
        }
        if (filters.dateFrom && adj.createdAt < filters.dateFrom) {
          return false;
        }
        if (filters.dateTo && adj.createdAt > filters.dateTo) {
          return false;
        }
        return true;
      });

      setAdjustments(filteredAdjustments);

      tag('adjustments_loaded', {
        totalCount: mockAdjustments.length,
        filteredCount: filteredAdjustments.length,
        filters
      });

    } catch (error) {
      tag('adjustments_load_failed', {
        error: error instanceof Error ? error.message : String(error),
        filters
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AdjustmentFilters, value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getArtifactTypeLabel = (type: string) => {
    switch (type) {
      case 'credit_memo': return 'Credit Memo';
      case 'disposal_fee': return 'Disposal Fee';
      case 'rtv_charge': return 'RTV Charge';
      case 'repair_invoice': return 'Repair Invoice';
      default: return type;
    }
  };

  const getArtifactTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'credit_memo': return 'default';
      case 'disposal_fee': return 'secondary';
      case 'rtv_charge': return 'outline';
      case 'repair_invoice': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'posted': return 'default';
      case 'pending': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const totalAmount = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const postedAmount = adjustments
    .filter(adj => adj.status === 'posted')
    .reduce((sum, adj) => sum + adj.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold">RMA Adjustments - V17.1.3</h1>
          </div>
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading adjustments...</div>
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
            <h1 className="text-2xl font-bold">RMA Adjustments</h1>
            <p className="text-muted-foreground">V17.1.3 - Financial adjustments from RMA processing</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Adjustments</div>
              <div className="text-2xl font-bold">{adjustments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Posted Amount</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(postedAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Pending Amount</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalAmount - postedAmount)}
              </div>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Client</label>
                <Input
                  placeholder="Client name"
                  value={filters.clientName || ''}
                  onChange={(e) => handleFilterChange('clientName', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Artifact Type</label>
                <Select value={filters.artifactType || ''} onValueChange={(value) => handleFilterChange('artifactType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="credit_memo">Credit Memo</SelectItem>
                    <SelectItem value="disposal_fee">Disposal Fee</SelectItem>
                    <SelectItem value="rtv_charge">RTV Charge</SelectItem>
                    <SelectItem value="repair_invoice">Repair Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
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

        {/* Adjustments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              RMA Adjustments ({adjustments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Artifact Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>GL Journal ID</TableHead>
                  <TableHead>Posted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell className="font-mono text-sm">
                      {adjustment.rmaId}
                    </TableCell>
                    <TableCell>{adjustment.clientName}</TableCell>
                    <TableCell>
                      <Badge variant={getArtifactTypeBadgeVariant(adjustment.artifactType)}>
                        {getArtifactTypeLabel(adjustment.artifactType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(adjustment.amount)}
                    </TableCell>
                    <TableCell>
                      {adjustment.glJournalId ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{adjustment.glJournalId}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {adjustment.postedAt ? (
                        <span className="text-sm">{formatDate(adjustment.postedAt)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(adjustment.status)}>
                        {adjustment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {adjustment.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {adjustments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No adjustments found matching the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}