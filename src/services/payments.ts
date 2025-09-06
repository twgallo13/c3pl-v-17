/**
 * C3PL V17.1.4 Payments Service
 * Record, apply, and reconcile payments with GL integration
 */

import { logEvent, stamp } from '@/lib/build-log';
import { PaymentReceipt, PaymentMethod, BankTransaction } from '@/lib/types/finance';
import { Invoice } from '@/lib/types';
import { postGL } from '@/lib/gl-posting';

const tag = stamp('V17.1.4', 'payments');

// Record a new payment receipt
export async function recordPayment(receipt: Omit<PaymentReceipt, 'payment_id' | 'status' | 'allocations'>): Promise<{ payment_id: string }> {
  const payment_id = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newReceipt: PaymentReceipt = {
    ...receipt,
    payment_id,
    status: 'recorded',
    allocations: [],
    audit: {
      created_at: new Date().toISOString(),
      created_by: 'current-user', // In real app, get from auth
      events: []
    }
  };

  // Store in KV (in real app, this would go to Firestore)
  // For demo purposes, we'll just log the event
  tag('payment_recorded', { 
    payment_id, 
    method: receipt.method, 
    amount: receipt.amount,
    reference: receipt.reference
  });

  return { payment_id };
}

// Apply payment allocations to invoices
export async function applyPayment(
  payment_id: string, 
  allocations: { invoice_id: string; amount: number }[]
): Promise<{ success: boolean; updated_invoices: string[] }> {
  
  const updated_invoices: string[] = [];
  
  for (const allocation of allocations) {
    // In real app, update invoice balance and status
    // For now, just log the allocation
    tag('payment_applied', {
      payment_id,
      invoice_id: allocation.invoice_id,
      amount: allocation.amount
    });
    
    updated_invoices.push(allocation.invoice_id);
    
    // Optional GL posting (Cash/Bank vs AR)
    if (allocation.amount > 0) {
      try {
        await postGL({
          version: 'V17.1.4',
          module: 'payments',
          sourceRef: { payment_id, invoice_id: allocation.invoice_id },
          entries: [
            { acct: '1000', debit: allocation.amount, credit: 0, memo: 'Cash received' },
            { acct: '1200', debit: 0, credit: allocation.amount, memo: 'AR reduction' }
          ]
        });
      } catch (error) {
        tag('gl_posting_failed', { payment_id, allocation, error: String(error) });
      }
    }
  }

  // Update payment status
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  // In real app, compare with payment amount to determine if fully applied
  
  tag('payment_allocations_applied', {
    payment_id,
    total_allocated: totalAllocated,
    invoice_count: allocations.length
  });

  return { success: true, updated_invoices };
}

// Reconcile payment with bank transaction
export async function reconcilePayment(
  payment_id: string, 
  bank_txn_ref: string
): Promise<{ success: boolean }> {
  
  // Update payment status to 'reconciled' and store bank reference
  tag('payment_reconciled', {
    payment_id,
    bank_txn_ref,
    reconciled_at: new Date().toISOString()
  });

  return { success: true };
}

// Search invoices for payment application
export async function searchInvoicesForPayment(
  client_id?: string,
  status?: 'issued' | 'overdue',
  has_balance?: boolean
): Promise<Invoice[]> {
  
  // In real app, query Firestore with filters
  // For demo, return mock data
  const mockInvoices: Invoice[] = [
    {
      id: 'INV-001',
      invoiceNumber: 'INV-2024-001',
      clientId: client_id || 'CLIENT-001',
      clientName: 'Acme Corp',
      status: 'Issued',
      issuedDate: '2024-01-15',
      dueDate: '2024-02-14',
      lineItems: [
        {
          id: 'line-1',
          description: 'Widget Assembly',
          quantity: 10,
          unitPrice: 150.00,
          amount: 1500.00
        }
      ],
      totals: {
        subtotal: 1500.00,
        discounts: 0,
        taxes: 120.00,
        grandTotal: 1620.00
      },
      notes: [],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      createdBy: 'system',
      updatedBy: 'system'
    }
  ];

  tag('invoices_searched', {
    client_id,
    status,
    has_balance,
    results_count: mockInvoices.length
  });

  return mockInvoices;
}

// Calculate running balance for payment allocation
export function calculateRunningBalance(
  payment_amount: number,
  allocations: { invoice_id: string; amount: number }[]
): number {
  const total_allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  return payment_amount - total_allocated;
}