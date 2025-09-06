/**
 * C3PL V17.1.3 Payments Service
 * Handle payment recording, invoice status updates, and optional GL posting
 */

import { logEvent, stamp } from './build-log';
import { postGL, createPaymentGLEntries, type GlPostResult } from './gl-posting';
import type { Invoice } from './types';

const tag = stamp('V17.1.3', 'payments');

export type PaymentMethod = 'cash' | 'check' | 'ach' | 'wire' | 'card';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;       // ISO date
  reference?: string;        // Check number, transaction ID, etc.
  notes?: string;
  glJournalId?: string;      // GL journal entry ID (if GL posting enabled)
  createdAt: string;
  createdBy: string;
}

export interface PaymentResult {
  payment: PaymentRecord;
  invoice: {
    id: string;
    previousStatus: string;
    newStatus: string;
    balanceDue: number;
  };
  glPosted?: GlPostResult;
}

/**
 * Record a payment against an invoice
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  paymentDate: string,
  reference?: string,
  notes?: string,
  enableGLPosting: boolean = false,
  actor: string = 'system'
): Promise<PaymentResult> {
  // Validate inputs
  validatePaymentInputs(invoiceId, amount, method, paymentDate);
  
  // Fetch invoice (in real app, from Firestore)
  const invoice = await fetchInvoice(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }
  
  if (invoice.status === 'draft') {
    throw new Error(`Cannot record payment against draft invoice ${invoiceId}`);
  }
  
  if (invoice.status === 'void') {
    throw new Error(`Cannot record payment against voided invoice ${invoiceId}`);
  }
  
  // Calculate new balance
  const currentPayments = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const newPaymentsTotal = currentPayments + amount;
  const balanceDue = Math.max(0, invoice.grandTotal - newPaymentsTotal);
  
  if (newPaymentsTotal > invoice.grandTotal) {
    throw new Error(`Payment amount $${amount} would exceed invoice total $${invoice.grandTotal}`);
  }
  
  // Create payment record
  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const payment: PaymentRecord = {
    id: paymentId,
    invoiceId,
    amount,
    method,
    paymentDate,
    reference,
    notes,
    createdAt: new Date().toISOString(),
    createdBy: actor
  };
  
  let glPosted: GlPostResult | undefined;
  
  // Optional GL posting
  if (enableGLPosting) {
    try {
      const glEntries = createPaymentGLEntries({
        invoiceId,
        amount,
        method
      });
      
      glPosted = await postGL({
        version: 'V17.1.3',
        module: 'payments',
        sourceRef: { invoiceId, paymentId },
        entries: glEntries
      });
      
      payment.glJournalId = glPosted.journalId;
      
    } catch (error) {
      tag('payment_gl_failed', {
        paymentId,
        invoiceId,
        amount,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  // Determine new invoice status
  const previousStatus = invoice.status;
  const newStatus = balanceDue === 0 ? 'paid' : 'issued';
  
  // Update invoice (simulate Firestore update)
  const updatedInvoice = {
    ...invoice,
    status: newStatus,
    payments: [...(invoice.payments || []), payment],
    balanceDue,
    lastPaymentDate: paymentDate,
    paidAt: newStatus === 'paid' ? new Date().toISOString() : invoice.paidAt
  };
  
  // Simulate persistence
  console.info('[PAYMENT-RECORDED]', payment);
  console.info('[INVOICE-UPDATED]', { 
    id: invoiceId, 
    previousStatus, 
    newStatus, 
    balanceDue,
    paymentsCount: updatedInvoice.payments.length
  });
  
  // Log payment event
  tag('payment_recorded', {
    paymentId,
    invoiceId,
    amount,
    method,
    balanceDue,
    statusChange: previousStatus !== newStatus ? `${previousStatus} → ${newStatus}` : null,
    glPosted: !!glPosted
  });
  
  // Log status change if applicable
  if (previousStatus !== newStatus) {
    logEvent({
      version: 'V17.1.3',
      module: 'billing',
      action: 'invoice_paid',
      details: {
        invoiceId,
        previousStatus,
        newStatus,
        finalPaymentAmount: amount,
        totalPaid: newPaymentsTotal,
        grandTotal: invoice.grandTotal
      },
      actor
    });
  }
  
  return {
    payment,
    invoice: {
      id: invoiceId,
      previousStatus,
      newStatus,
      balanceDue
    },
    glPosted
  };
}

/**
 * Get payment history for an invoice
 */
export async function getPaymentHistory(invoiceId: string): Promise<PaymentRecord[]> {
  // In real app, fetch from Firestore
  const invoice = await fetchInvoice(invoiceId);
  return invoice?.payments || [];
}

/**
 * Get payment summary across all invoices
 */
export async function getPaymentSummary(
  clientId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  totalPayments: number;
  paymentCount: number;
  averagePayment: number;
  paymentsByMethod: Record<PaymentMethod, { count: number; total: number }>;
}> {
  // In real app, query Firestore with filters
  // For demo, return mock data
  
  const mockPayments: PaymentRecord[] = [
    {
      id: 'PAY-1',
      invoiceId: 'INV-001',
      amount: 1000,
      method: 'ach',
      paymentDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'PAY-2',
      invoiceId: 'INV-002',
      amount: 500,
      method: 'check',
      paymentDate: '2024-01-16',
      reference: 'CHK-123',
      createdAt: '2024-01-16T14:30:00Z',
      createdBy: 'finance'
    }
  ];
  
  // Filter by date range if provided
  const filteredPayments = mockPayments.filter(payment => {
    if (dateFrom && payment.paymentDate < dateFrom) return false;
    if (dateTo && payment.paymentDate > dateTo) return false;
    return true;
  });
  
  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paymentCount = filteredPayments.length;
  const averagePayment = paymentCount > 0 ? totalPayments / paymentCount : 0;
  
  // Group by payment method
  const paymentsByMethod: Record<PaymentMethod, { count: number; total: number }> = {
    cash: { count: 0, total: 0 },
    check: { count: 0, total: 0 },
    ach: { count: 0, total: 0 },
    wire: { count: 0, total: 0 },
    card: { count: 0, total: 0 }
  };
  
  for (const payment of filteredPayments) {
    paymentsByMethod[payment.method].count++;
    paymentsByMethod[payment.method].total += payment.amount;
  }
  
  return {
    totalPayments,
    paymentCount,
    averagePayment,
    paymentsByMethod
  };
}

/**
 * Validate payment inputs
 */
function validatePaymentInputs(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  paymentDate: string
): void {
  if (!invoiceId || invoiceId.trim() === '') {
    throw new Error('Invoice ID is required');
  }
  
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  
  if (!method || !['cash', 'check', 'ach', 'wire', 'card'].includes(method)) {
    throw new Error('Invalid payment method');
  }
  
  if (!paymentDate || !isValidISODate(paymentDate)) {
    throw new Error('Invalid payment date format (expected ISO date)');
  }
}

/**
 * Validate ISO date format
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && 
         dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Fetch invoice by ID (mock implementation)
 */
async function fetchInvoice(invoiceId: string): Promise<Invoice | null> {
  // In real app, fetch from Firestore
  // For demo, return mock invoice
  
  if (!invoiceId.startsWith('INV-')) {
    return null;
  }
  
  return {
    id: invoiceId,
    invoiceNumber: invoiceId,
    clientId: 'client-001',
    client: {
      id: 'client-001',
      name: 'Acme Corp',
      email: 'billing@acme.com'
    },
    status: 'issued',
    issuedDate: '2024-01-10',
    dueDate: '2024-02-10',
    subtotal: 1000,
    discountAmount: 50,
    afterDiscounts: 950,
    taxAmount: 76,
    grandTotal: 1026,
    lineItems: [],
    notes: {
      vendorVisible: [],
      internal: []
    },
    exports: {},
    createdAt: '2024-01-10T10:00:00Z',
    createdBy: 'system',
    payments: []
  };
}