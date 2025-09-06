/**
 * C3PL V17.1.4 Bank Reconciliation
 * Import bank feeds and match to recorded payments
 */

import { logEvent, stamp } from '@/lib/build-log';
import { BankTransaction, PaymentReceipt } from '@/lib/types/finance';

const tag = stamp('V17.1.4', 'bank-recon');

export interface BankCSVRow {
  date: string;
  amount: number;
  reference: string;
  memo?: string;
}

export interface MatchSuggestion {
  bank_transaction: BankTransaction;
  suggested_payment?: PaymentReceipt;
  confidence: 'high' | 'medium' | 'low';
  match_reasons: string[];
}

// Parse bank CSV feed
export function parseBankCSV(csvContent: string): BankCSVRow[] {
  const lines = csvContent.trim().split('\n');
  const header = lines[0].toLowerCase().split(',');
  
  const dateIndex = header.findIndex(h => h.includes('date'));
  const amountIndex = header.findIndex(h => h.includes('amount'));
  const referenceIndex = header.findIndex(h => h.includes('reference') || h.includes('ref'));
  const memoIndex = header.findIndex(h => h.includes('memo') || h.includes('description'));

  const rows: BankCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    
    if (columns.length >= 3) {
      rows.push({
        date: columns[dateIndex]?.trim() || '',
        amount: parseFloat(columns[amountIndex]?.trim() || '0'),
        reference: columns[referenceIndex]?.trim() || '',
        memo: memoIndex >= 0 ? columns[memoIndex]?.trim() : undefined
      });
    }
  }

  tag('bank_csv_parsed', { 
    total_rows: rows.length,
    date_range: {
      earliest: rows[0]?.date,
      latest: rows[rows.length - 1]?.date
    }
  });

  return rows;
}

// Match bank transactions to payments
export function suggestMatches(
  bankTransactions: BankTransaction[],
  payments: PaymentReceipt[]
): MatchSuggestion[] {
  
  const suggestions: MatchSuggestion[] = [];
  
  for (const bankTxn of bankTransactions) {
    // Skip if already matched
    if (bankTxn.matched_payment_id) continue;
    
    let bestMatch: PaymentReceipt | undefined;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    const matchReasons: string[] = [];
    
    for (const payment of payments) {
      // Skip if payment already reconciled
      if (payment.status === 'reconciled') continue;
      
      const reasons: string[] = [];
      let score = 0;
      
      // Amount match (±$0.01)
      if (Math.abs(bankTxn.amount - payment.amount) <= 0.01) {
        reasons.push('Exact amount match');
        score += 50;
      } else if (Math.abs(bankTxn.amount - payment.amount) <= 1.00) {
        reasons.push('Close amount match (±$1.00)');
        score += 20;
      }
      
      // Date match (±3 days)
      const bankDate = new Date(bankTxn.date);
      const paymentDate = new Date(payment.date);
      const daysDiff = Math.abs((bankDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        reasons.push('Same day');
        score += 30;
      } else if (daysDiff <= 3) {
        reasons.push('Within 3 days');
        score += 15;
      }
      
      // Reference match
      if (payment.reference && bankTxn.reference) {
        if (payment.reference === bankTxn.reference) {
          reasons.push('Exact reference match');
          score += 40;
        } else if (payment.reference.includes(bankTxn.reference) || bankTxn.reference.includes(payment.reference)) {
          reasons.push('Partial reference match');
          score += 20;
        }
      }
      
      // Determine confidence
      if (score >= 80) {
        confidence = 'high';
      } else if (score >= 40) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
      
      if (score > 0 && (!bestMatch || reasons.length > matchReasons.length)) {
        bestMatch = payment;
        matchReasons.splice(0, matchReasons.length, ...reasons);
      }
    }
    
    suggestions.push({
      bank_transaction: bankTxn,
      suggested_payment: bestMatch,
      confidence,
      match_reasons: matchReasons
    });
  }
  
  tag('match_suggestions_generated', {
    bank_transactions: bankTransactions.length,
    suggestions: suggestions.length,
    high_confidence: suggestions.filter(s => s.confidence === 'high').length,
    medium_confidence: suggestions.filter(s => s.confidence === 'medium').length
  });
  
  return suggestions;
}

// Import and process bank CSV
export async function importBankCSV(csvContent: string): Promise<{
  transactions: BankTransaction[];
  suggestions: MatchSuggestion[];
}> {
  
  const csvRows = parseBankCSV(csvContent);
  
  const transactions: BankTransaction[] = csvRows.map((row, index) => ({
    id: `BANK-${Date.now()}-${index}`,
    date: row.date,
    amount: row.amount,
    reference: row.reference,
    memo: row.memo
  }));
  
  // In real app, fetch existing payments from Firestore
  const existingPayments: PaymentReceipt[] = []; // Mock empty for now
  
  const suggestions = suggestMatches(transactions, existingPayments);
  
  tag('bank_csv_imported', {
    transactions_imported: transactions.length,
    suggestions_generated: suggestions.length
  });
  
  return { transactions, suggestions };
}