/**
 * C3PL V17.1.4 Remittance Export Service
 * Generate remittance advice for payments
 */

import { logEvent, stamp } from '@/lib/build-log';
import { PaymentReceipt, RemittanceAdvice } from '@/lib/types/finance';
import { Invoice } from '@/lib/types';
import { createHash } from 'crypto';

const tag = stamp('V17.1.4', 'remittance');

// Generate remittance advice data
export async function generateRemittanceAdvice(
  payment: PaymentReceipt,
  invoices: Invoice[]
): Promise<RemittanceAdvice> {
  
  const allocations = payment.allocations.map(alloc => {
    const invoice = invoices.find(inv => inv.id === alloc.invoice_id);
    
    if (!invoice) {
      throw new Error(`Invoice ${alloc.invoice_id} not found for remittance`);
    }
    
    return {
      invoice_number: invoice.invoiceNumber,
      invoice_amount: invoice.totals.grandTotal,
      amount_applied: alloc.amount,
      remaining_balance: invoice.totals.grandTotal - alloc.amount
    };
  });
  
  const remittance: RemittanceAdvice = {
    id: `REM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    payment_id: payment.payment_id,
    client_id: invoices[0]?.clientId || 'unknown',
    client_name: invoices[0]?.clientName || 'Unknown Client',
    payment_amount: payment.amount,
    payment_method: payment.method,
    payment_date: payment.date,
    allocations,
    generated_at: new Date().toISOString(),
    generated_by: 'current-user', // In real app, get from auth
    export_digests: {}
  };
  
  tag('remittance_advice_generated', {
    remittance_id: remittance.id,
    payment_id: payment.payment_id,
    client_id: remittance.client_id,
    allocations_count: allocations.length,
    total_amount: payment.amount
  });
  
  return remittance;
}

// Generate remittance PDF content (mock)
export function generateRemittancePDF(remittance: RemittanceAdvice): string {
  const pdfContent = `
REMITTANCE ADVICE
=================

Date: ${remittance.generated_at.split('T')[0]}
Remittance ID: ${remittance.id}

CLIENT INFORMATION
Client: ${remittance.client_name}
Client ID: ${remittance.client_id}

PAYMENT DETAILS
Payment Amount: $${remittance.payment_amount.toFixed(2)}
Payment Method: ${remittance.payment_method.toUpperCase()}
Payment Date: ${remittance.payment_date}

ALLOCATIONS
${remittance.allocations.map(alloc => 
  `Invoice: ${alloc.invoice_number} | Applied: $${alloc.amount_applied.toFixed(2)} | Balance: $${alloc.remaining_balance.toFixed(2)}`
).join('\n')}

Total Applied: $${remittance.allocations.reduce((sum, a) => sum + a.amount_applied, 0).toFixed(2)}
  `.trim();
  
  tag('remittance_pdf_generated', {
    remittance_id: remittance.id,
    content_length: pdfContent.length
  });
  
  return pdfContent;
}

// Generate remittance CSV content
export function generateRemittanceCSV(remittance: RemittanceAdvice): string {
  const headers = [
    'Remittance ID',
    'Client Name',
    'Payment Amount',
    'Payment Method',
    'Payment Date',
    'Invoice Number',
    'Invoice Amount',
    'Amount Applied',
    'Remaining Balance'
  ];
  
  const rows = remittance.allocations.map(alloc => [
    remittance.id,
    remittance.client_name,
    remittance.payment_amount.toFixed(2),
    remittance.payment_method,
    remittance.payment_date,
    alloc.invoice_number,
    alloc.invoice_amount.toFixed(2),
    alloc.amount_applied.toFixed(2),
    alloc.remaining_balance.toFixed(2)
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  tag('remittance_csv_generated', {
    remittance_id: remittance.id,
    rows_count: rows.length
  });
  
  return csvContent;
}

// Calculate export digest
function calculateDigest(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Export remittance with parity check
export async function exportRemittanceWithParity(
  remittance: RemittanceAdvice,
  format: 'pdf' | 'csv'
): Promise<{ content: string; digest: string; totalsMatch: boolean }> {
  
  let content: string;
  
  switch (format) {
    case 'pdf':
      content = generateRemittancePDF(remittance);
      break;
    case 'csv':
      content = generateRemittanceCSV(remittance);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  const digest = calculateDigest(content);
  
  // Parity check: verify totals in export match UI totals
  const exportTotal = remittance.allocations.reduce((sum, a) => sum + a.amount_applied, 0);
  const uiTotal = remittance.payment_amount;
  const totalsMatch = Math.abs(exportTotal - uiTotal) < 0.01;
  
  if (!totalsMatch) {
    tag('export_parity_failed', {
      remittance_id: remittance.id,
      format,
      ui_total: uiTotal,
      export_total: exportTotal,
      difference: Math.abs(exportTotal - uiTotal)
    });
  } else {
    tag('export_parity_passed', {
      remittance_id: remittance.id,
      format,
      total: uiTotal,
      digest
    });
  }
  
  return { content, digest, totalsMatch };
}

// Update remittance with export digest
export async function updateRemittanceDigest(
  remittance_id: string,
  format: 'pdf' | 'csv',
  digest: string
): Promise<void> {
  
  // In real app, update Firestore document
  tag('remittance_digest_updated', {
    remittance_id,
    format,
    digest
  });
}