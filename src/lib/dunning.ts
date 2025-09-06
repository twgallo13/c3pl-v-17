/**
 * C3PL V17.1.4 Dunning Engine
 * Automated dunning queue generation and management
 */

import { logEvent, stamp } from '@/lib/build-log';
import { DunningRule, DunningQueueItem } from '@/lib/types/finance';
import { Invoice } from '@/lib/types';

const tag = stamp('V17.1.4', 'dunning');

// Default dunning rules
export const DEFAULT_DUNNING_RULES: DunningRule[] = [
  {
    id: 'NET_15',
    terms: 'net_15',
    stages: [
      { stage: 'reminder_1', days_offset: 3, action: 'email' },
      { stage: 'reminder_2', days_offset: 7, action: 'email' },
      { stage: 'final_notice', days_offset: 14, action: 'letter' }
    ],
    active: true
  },
  {
    id: 'NET_30',
    terms: 'net_30',
    stages: [
      { stage: 'reminder_1', days_offset: 5, action: 'email' },
      { stage: 'reminder_2', days_offset: 15, action: 'email' },
      { stage: 'final_notice', days_offset: 30, action: 'letter' }
    ],
    active: true
  },
  {
    id: 'DUE_ON_RECEIPT',
    terms: 'due_on_receipt',
    stages: [
      { stage: 'reminder_1', days_offset: 1, action: 'email' },
      { stage: 'reminder_2', days_offset: 3, action: 'phone' },
      { stage: 'final_notice', days_offset: 7, action: 'letter' }
    ],
    active: true
  }
];

// Calculate days past due
function calculateDaysPastDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// Determine invoice terms from due date patterns
function inferTermsFromInvoice(invoice: Invoice): 'net_15' | 'net_30' | 'due_on_receipt' {
  const issued = new Date(invoice.issuedDate);
  const due = new Date(invoice.dueDate);
  const diffDays = Math.ceil((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return 'due_on_receipt';
  if (diffDays <= 15) return 'net_15';
  return 'net_30';
}

// Determine dunning stage based on days past due and rules
function determineDunningStage(
  daysPastDue: number,
  rule: DunningRule
): { stage: 'reminder_1' | 'reminder_2' | 'final_notice'; next_action_date: string } | null {
  
  // Sort stages by days_offset
  const sortedStages = [...rule.stages].sort((a, b) => a.days_offset - b.days_offset);
  
  for (let i = sortedStages.length - 1; i >= 0; i--) {
    const stage = sortedStages[i];
    if (daysPastDue >= stage.days_offset) {
      const nextActionDate = new Date();
      nextActionDate.setDate(nextActionDate.getDate() + 1); // Next business day
      
      return {
        stage: stage.stage,
        next_action_date: nextActionDate.toISOString().split('T')[0]
      };
    }
  }
  
  return null;
}

// Generate dunning queue from overdue invoices
export async function generateDunningQueue(
  overdueInvoices: Invoice[]
): Promise<DunningQueueItem[]> {
  
  const queueItems: DunningQueueItem[] = [];
  
  for (const invoice of overdueInvoices) {
    // Skip if invoice is already paid or voided
    if (invoice.status === 'Paid' || invoice.status === 'Void') continue;
    
    const daysPastDue = calculateDaysPastDue(invoice.dueDate);
    
    // Skip if not actually overdue
    if (daysPastDue <= 0) continue;
    
    const terms = inferTermsFromInvoice(invoice);
    const rule = DEFAULT_DUNNING_RULES.find(r => r.terms === terms && r.active);
    
    if (!rule) {
      tag('dunning_rule_not_found', { 
        invoice_id: invoice.id, 
        terms,
        days_past_due: daysPastDue 
      });
      continue;
    }
    
    const stageInfo = determineDunningStage(daysPastDue, rule);
    
    if (!stageInfo) {
      // Not yet at first dunning stage
      continue;
    }
    
    const queueItem: DunningQueueItem = {
      id: `DUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoice_id: invoice.id,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      amount: invoice.totals.grandTotal,
      days_past_due: daysPastDue,
      stage: stageInfo.stage,
      next_action_date: stageInfo.next_action_date,
      rule_id: rule.id,
      status: 'pending'
    };
    
    queueItems.push(queueItem);
    
    tag('dunning_notice_generated', {
      invoice_id: invoice.id,
      client_id: invoice.clientId,
      stage: stageInfo.stage,
      days_past_due: daysPastDue,
      amount: invoice.totals.grandTotal
    });
  }
  
  tag('dunning_queue_generated', {
    total_overdue_invoices: overdueInvoices.length,
    queue_items_created: queueItems.length,
    stages: {
      reminder_1: queueItems.filter(q => q.stage === 'reminder_1').length,
      reminder_2: queueItems.filter(q => q.stage === 'reminder_2').length,
      final_notice: queueItems.filter(q => q.stage === 'final_notice').length
    }
  });
  
  return queueItems;
}

// Export dunning queue to CSV
export function exportDunningQueueCSV(queueItems: DunningQueueItem[]): string {
  const headers = [
    'Client',
    'Invoice ID', 
    'Days Past Due',
    'Amount',
    'Stage',
    'Next Action Date',
    'Status'
  ];
  
  const rows = queueItems.map(item => [
    item.client_name,
    item.invoice_id,
    item.days_past_due.toString(),
    item.amount.toFixed(2),
    item.stage.replace('_', ' ').toUpperCase(),
    item.next_action_date,
    item.status.toUpperCase()
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  tag('dunning_queue_exported', {
    format: 'CSV',
    items_exported: queueItems.length,
    total_amount: queueItems.reduce((sum, item) => sum + item.amount, 0)
  });
  
  return csvContent;
}

// Process dunning queue item (mark as processed)
export async function processDunningItem(
  item_id: string,
  action_taken: 'email_sent' | 'letter_sent' | 'phone_call_made' | 'hold'
): Promise<{ success: boolean }> {
  
  tag('dunning_item_processed', {
    item_id,
    action_taken,
    processed_at: new Date().toISOString()
  });
  
  // In real app, update the dunning queue item status
  return { success: true };
}