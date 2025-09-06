/**
 * C3PL V17.1.4 Finance Types
 * Comprehensive payments, reconciliation, and AR aging types
 */

export type PaymentMethod = 'ach'|'wire'|'credit_card'|'check';
export type PaymentStatus = 'recorded'|'reconciled'|'partially_applied'|'applied';

export interface PaymentReceipt {
  payment_id: string;
  method: PaymentMethod;
  amount: number;
  currency: 'USD';
  date: string; // ISO
  reference?: string; // bank txn id / check #
  status: PaymentStatus;
  allocations: { invoice_id: string; amount: number }[];
  audit: { created_at: string; created_by: string; events: AuditEvent[] };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: Record<string, any>;
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  memo?: string;
  matched_payment_id?: string;
  matched_at?: string;
  matched_by?: string;
}

export interface DunningRule {
  id: string;
  terms: 'net_15' | 'net_30' | 'due_on_receipt';
  stages: {
    stage: 'reminder_1' | 'reminder_2' | 'final_notice';
    days_offset: number;
    action: 'email' | 'letter' | 'phone';
  }[];
  active: boolean;
}

export interface DunningQueueItem {
  id: string;
  invoice_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  days_past_due: number;
  stage: 'reminder_1' | 'reminder_2' | 'final_notice';
  last_contact_date?: string;
  next_action_date: string;
  rule_id: string;
  status: 'pending' | 'processed' | 'hold';
}

export interface ARAging {
  client_id: string;
  client_name: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_over_90: number;
  total_outstanding: number;
  last_payment_date?: string;
}