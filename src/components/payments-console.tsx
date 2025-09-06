/**
 * C3PL V17.1.4 Payments Console
 * Finance/Admin interface for payment management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { VersionDisplay } from '@/components/version-display';
import { PaymentReceipt, PaymentMethod, PaymentStatus, BankTransaction, DunningQueueItem } from '@/lib/types/finance';
import { Invoice, UserRole } from '@/lib/types';
import { recordPayment, applyPayment, reconcilePayment, searchInvoicesForPayment, calculateRunningBalance } from '@/services/payments';
import { importBankCSV } from '@/lib/bank-recon';
import { generateDunningQueue, exportDunningQueueCSV } from '@/lib/dunning';
import { ArrowLeft, Plus, Upload, Download, CreditCard, Bank, Receipt, AlertTriangle, DollarSign, Calendar, FileText } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';

interface PaymentsConsoleProps {
  userRole: UserRole;
  onBack: () => void;
}

// Mock data for demonstration
const mockPayments: PaymentReceipt[] = [
  {
    payment_id: 'PAY-2024-001',
    method: 'ach',
    amount: 1620.00,
    currency: 'USD',
    date: '2024-01-15',
    reference: 'ACH-12345',
    status: 'applied',
    allocations: [
      { invoice_id: 'INV-001', amount: 1620.00 }
    ],
    audit: {
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'finance-user',
      events: []
    }
  },
  {
    payment_id: 'PAY-2024-002',
    method: 'credit_card',
    amount: 2500.00,
    currency: 'USD',
    date: '2024-01-16',
    reference: 'CC-67890',
    status: 'recorded',
    allocations: [],
    audit: {
      created_at: '2024-01-16T14:30:00Z',
      created_by: 'finance-user',
      events: []
    }
  }
];

const mockBankTransactions: BankTransaction[] = [
  {
    id: 'BANK-001',
    date: '2024-01-16',
    amount: 2500.00,
    reference: 'CC-67890',
    memo: 'Credit card payment'
  }
];

const mockDunningQueue: DunningQueueItem[] = [
  {
    id: 'DUN-001',
    invoice_id: 'INV-003',
    client_id: 'CLIENT-002',
    client_name: 'Tech Solutions Inc',
    amount: 850.00,
    days_past_due: 5,
    stage: 'reminder_1',
    next_action_date: '2024-01-17',
    rule_id: 'NET_30',
    status: 'pending'
  },
  {
    id: 'DUN-002',
    invoice_id: 'INV-004',
    client_id: 'CLIENT-003',
    client_name: 'Global Manufacturing',
    amount: 3200.00,
    days_past_due: 12,
    stage: 'reminder_2',
    next_action_date: '2024-01-17',
    rule_id: 'NET_15',
    status: 'pending'
  }
];

export function PaymentsConsole({ userRole, onBack }: PaymentsConsoleProps) {
  const [payments] = useKV<PaymentReceipt[]>('c3pl-payments', mockPayments);
  const [bankTransactions] = useKV<BankTransaction[]>('c3pl-bank-transactions', mockBankTransactions);
  const [dunningQueue] = useKV<DunningQueueItem[]>('c3pl-dunning-queue', mockDunningQueue);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceipt | null>(null);
  const [showApplyPayment, setShowApplyPayment] = useState(false);
  const [csvImportContent, setCsvImportContent] = useState('');

  // RBAC Check
  const hasFullAccess = userRole === 'Finance' || userRole === 'Admin';
  const hasReadOnly = userRole === 'Account Manager' || userRole === 'Customer Service';

  if (!hasFullAccess && !hasReadOnly) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground mt-2">
              Finance operations require Finance or Admin role.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRecordPayment = async (paymentData: any) => {
    try {
      const result = await recordPayment(paymentData);
      toast.success(`Payment ${result.payment_id} recorded successfully`);
    } catch (error) {
      toast.error('Failed to record payment');
      console.error(error);
    }
  };

  const handleApplyPayment = async (payment_id: string, allocations: any[]) => {
    try {
      const result = await applyPayment(payment_id, allocations);
      toast.success(`Payment applied to ${result.updated_invoices.length} invoices`);
      setShowApplyPayment(false);
    } catch (error) {
      toast.error('Failed to apply payment');
      console.error(error);
    }
  };

  const handleReconcilePayment = async (payment_id: string, bank_ref: string) => {
    try {
      await reconcilePayment(payment_id, bank_ref);
      toast.success('Payment reconciled successfully');
    } catch (error) {
      toast.error('Failed to reconcile payment');
      console.error(error);
    }
  };

  const handleImportBankCSV = async () => {
    try {
      const result = await importBankCSV(csvImportContent);
      toast.success(`Imported ${result.transactions.length} transactions with ${result.suggestions.length} suggestions`);
      setCsvImportContent('');
    } catch (error) {
      toast.error('Failed to import bank CSV');
      console.error(error);
    }
  };

  const handleExportDunning = () => {
    const csvContent = exportDunningQueueCSV(dunningQueue);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dunning-queue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dunning queue exported');
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants = {
      recorded: 'secondary',
      reconciled: 'default',
      partially_applied: 'outline',
      applied: 'default'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'ach':
      case 'wire':
        return <Bank className="h-4 w-4" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'check':
        return <Receipt className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payments Console</h1>
            <p className="text-muted-foreground">Payment processing, reconciliation, and AR management</p>
          </div>
        </div>
        <VersionDisplay />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="receipts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="unapplied">Unapplied</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="dunning">Dunning</TabsTrigger>
        </TabsList>

        {/* Receipts Tab */}
        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Receipts</CardTitle>
                {hasFullAccess && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record New Payment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Amount</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <Label>Method</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ach">ACH</SelectItem>
                              <SelectItem value="wire">Wire</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Reference</Label>
                          <Input placeholder="Transaction reference" />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input type="date" />
                        </div>
                        <Button className="w-full">Record Payment</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Invoices</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.payment_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {payment.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          {payment.method.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.reference || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.allocations.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {hasFullAccess && payment.status !== 'applied' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowApplyPayment(true);
                              }}
                            >
                              Apply
                            </Button>
                          )}
                          {hasFullAccess && payment.status === 'recorded' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReconcilePayment(payment.payment_id, 'BANK-123')}
                            >
                              Reconcile
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unapplied Tab */}
        <TabsContent value="unapplied">
          <Card>
            <CardHeader>
              <CardTitle>Unapplied Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No unapplied payments at this time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bank Reconciliation</CardTitle>
                {hasFullAccess && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Bank CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Import Bank Transactions</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>CSV Content</Label>
                          <textarea 
                            className="w-full h-32 p-3 border rounded-md"
                            placeholder="Paste CSV content here..."
                            value={csvImportContent}
                            onChange={(e) => setCsvImportContent(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={handleImportBankCSV}
                          disabled={!csvImportContent.trim()}
                        >
                          Import & Match
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead>Matched Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{txn.date}</TableCell>
                      <TableCell className="font-mono">${txn.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
                      <TableCell className="text-sm">{txn.memo || 'N/A'}</TableCell>
                      <TableCell>
                        {txn.matched_payment_id ? (
                          <Badge>Matched</Badge>
                        ) : (
                          <Badge variant="outline">Unmatched</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasFullAccess && !txn.matched_payment_id && (
                          <Button size="sm" variant="outline">
                            Match
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dunning Tab */}
        <TabsContent value="dunning">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dunning Queue</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportDunning}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  {hasFullAccess && (
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Letters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Days Past Due</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dunningQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.invoice_id}</TableCell>
                      <TableCell className="font-mono">${item.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          {item.days_past_due} days
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.stage === 'final_notice' ? 'destructive' : 'secondary'}>
                          {item.stage.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.next_action_date}</TableCell>
                      <TableCell>
                        {hasFullAccess && (
                          <Button size="sm" variant="outline">
                            Process
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Payment Drawer */}
      <Drawer open={showApplyPayment} onOpenChange={setShowApplyPayment}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              Apply Payment: {selectedPayment?.payment_id}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Payment Details</h3>
                {selectedPayment && (
                  <div className="space-y-2 text-sm">
                    <div>Amount: ${selectedPayment.amount.toFixed(2)}</div>
                    <div>Method: {selectedPayment.method.toUpperCase()}</div>
                    <div>Date: {selectedPayment.date}</div>
                    <div>Reference: {selectedPayment.reference || 'N/A'}</div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-4">Available Invoices</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">INV-2024-001</span>
                      <span className="font-mono">$1,620.00</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Acme Corp</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowApplyPayment(false)}>
                Apply Payment
              </Button>
              <Button variant="outline" onClick={() => setShowApplyPayment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}