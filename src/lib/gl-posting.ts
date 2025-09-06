/**
 * C3PL V17.1.3 GL Posting Service
 * Centralized general ledger posting with validation and audit trail
 */

import { logEvent, stamp } from './build-log';

export type GlEntry = {
  acct: string;       // Chart of accounts code
  debit: number;      // Debit amount (>= 0)
  credit: number;     // Credit amount (>= 0)
  memo?: string;      // Optional description
};

export type GlPostResult = {
  journalId: string;  // Unique journal entry ID
  debits: number;     // Total debits
  credits: number;    // Total credits
  at: string;         // Posting timestamp (ISO)
};

export type GlSource = {
  version: 'V17.1.3';
  module: 'billing' | 'rma' | 'payments';
  sourceRef: {
    invoiceId?: string;
    rmaId?: string;
    rmaLineId?: string;
    paymentId?: string;
  };
  entries: GlEntry[];
};

const tag = stamp('V17.1.3', 'finance');

/**
 * Post general ledger entries with full validation
 */
export async function postGL(source: GlSource): Promise<GlPostResult> {
  // Validate entries
  validateGLEntries(source.entries);
  
  // Generate journal ID
  const journalId = `GL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const at = new Date().toISOString();
  
  // Calculate totals
  const debits = source.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const credits = source.entries.reduce((sum, entry) => sum + entry.credit, 0);
  
  // Ensure balanced entry
  if (Math.abs(debits - credits) > 0.01) {
    const error = new Error(`GL entry not balanced: debits=${debits}, credits=${credits}`);
    tag('gl_post_failed', {
      journalId,
      error: 'unbalanced_entry',
      debits,
      credits,
      difference: debits - credits,
      sourceRef: source.sourceRef
    });
    throw error;
  }
  
  // Create journal record (in real app, this would write to Firestore)
  const journalRecord = {
    journalId,
    version: source.version,
    module: source.module,
    sourceRef: source.sourceRef,
    entries: source.entries.map(entry => ({
      ...entry,
      debit: roundCurrency(entry.debit),
      credit: roundCurrency(entry.credit)
    })),
    totals: {
      debits: roundCurrency(debits),
      credits: roundCurrency(credits)
    },
    status: 'posted',
    postedAt: at,
    postedBy: 'system' // In real app, would be current user
  };
  
  // Simulate persistence (in real app: await firestore.collection('gl_journals').doc(journalId).set(journalRecord))
  console.info('[GL-JOURNAL]', journalRecord);
  
  // Log successful posting
  tag('gl_posted', {
    journalId,
    debits: roundCurrency(debits),
    credits: roundCurrency(credits),
    entryCount: source.entries.length,
    sourceRef: source.sourceRef
  });
  
  return {
    journalId,
    debits: roundCurrency(debits),
    credits: roundCurrency(credits),
    at
  };
}

/**
 * Validate GL entries for correctness
 */
function validateGLEntries(entries: GlEntry[]): void {
  if (!entries || entries.length === 0) {
    throw new Error('GL entries cannot be empty');
  }
  
  for (const entry of entries) {
    if (!entry.acct || entry.acct.trim() === '') {
      throw new Error('GL entry missing account code');
    }
    
    if (entry.debit < 0 || entry.credit < 0) {
      throw new Error('GL entry amounts must be >= 0');
    }
    
    if (entry.debit > 0 && entry.credit > 0) {
      throw new Error('GL entry cannot have both debit and credit amounts');
    }
    
    if (entry.debit === 0 && entry.credit === 0) {
      throw new Error('GL entry must have either debit or credit amount');
    }
    
    // Validate precision to 2 decimal places
    if (!isValidCurrency(entry.debit) || !isValidCurrency(entry.credit)) {
      throw new Error('GL entry amounts must have maximum 2 decimal places');
    }
  }
}

/**
 * Round currency to 2 decimal places
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Check if a number is valid currency (max 2 decimal places)
 */
function isValidCurrency(amount: number): boolean {
  return Number.isFinite(amount) && Math.round(amount * 100) === amount * 100;
}

/**
 * Create GL entries for invoice issuance
 */
export function createInvoiceGLEntries(invoice: {
  id: string;
  total: number;
  clientId: string;
}): GlEntry[] {
  return [
    {
      acct: '1200', // Accounts Receivable
      debit: invoice.total,
      credit: 0,
      memo: `Invoice ${invoice.id} - ${invoice.clientId}`
    },
    {
      acct: '4000', // Revenue
      debit: 0,
      credit: invoice.total,
      memo: `Invoice ${invoice.id} - ${invoice.clientId}`
    }
  ];
}

/**
 * Create GL entries for payment receipt
 */
export function createPaymentGLEntries(payment: {
  invoiceId: string;
  amount: number;
  method: 'cash' | 'check' | 'ach' | 'wire';
}): GlEntry[] {
  const cashAccount = payment.method === 'cash' ? '1000' : '1100'; // Cash vs Bank
  
  return [
    {
      acct: cashAccount,
      debit: payment.amount,
      credit: 0,
      memo: `Payment ${payment.invoiceId} - ${payment.method}`
    },
    {
      acct: '1200', // Accounts Receivable
      debit: 0,
      credit: payment.amount,
      memo: `Payment ${payment.invoiceId} - ${payment.method}`
    }
  ];
}

/**
 * Create GL entries for RMA credit memo
 */
export function createRMACreditGLEntries(rma: {
  id: string;
  amount: number;
  clientId: string;
}): GlEntry[] {
  return [
    {
      acct: '4000', // Revenue (contra)
      debit: rma.amount,
      credit: 0,
      memo: `RMA Credit ${rma.id} - ${rma.clientId}`
    },
    {
      acct: '1200', // Accounts Receivable
      debit: 0,
      credit: rma.amount,
      memo: `RMA Credit ${rma.id} - ${rma.clientId}`
    }
  ];
}

/**
 * Create GL entries for disposal fee
 */
export function createDisposalGLEntries(disposal: {
  rmaId: string;
  amount: number;
  clientId: string;
}): GlEntry[] {
  return [
    {
      acct: '1200', // Accounts Receivable
      debit: disposal.amount,
      credit: 0,
      memo: `Disposal Fee ${disposal.rmaId} - ${disposal.clientId}`
    },
    {
      acct: '4200', // Disposal Revenue
      debit: 0,
      credit: disposal.amount,
      memo: `Disposal Fee ${disposal.rmaId} - ${disposal.clientId}`
    }
  ];
}