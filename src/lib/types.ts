export const VERSION = "V17.1.4" as const;

export type UserRole = "Vendor" | "Account Manager" | "Customer Service" | "Operations" | "Admin" | "Finance" | "Associate" | "Manager";

export interface QAUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  actor: string;
  module: string;
}

export interface NetworkRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  payload: any;
  response: any;
  responseTime: number;
  statusCode: number;
  errorCode?: string;
  actor: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  module: string;
  timestamp: string;
  actor: string;
}

export interface ErrorReplayData {
  id: string;
  timestamp: string;
  action: string;
  payload: any;
  errorMessage: string;
  stackTrace: string;
  actor: string;
  module: string;
  logs: LogEntry[];
}

// Invoice System Types (Firestore Schema)
export type InvoiceStatus = "Draft" | "Issued" | "Paid" | "Void";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discounts: number;
  taxes: number;
  grandTotal: number;
}

export interface InvoiceNote {
  id: string;
  type: "vendor" | "internal";
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  totals: InvoiceTotals;
  notes: InvoiceNote[];
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ExportParityResult {
  format: "PDF" | "Excel" | "CSV";
  totalsMatch: boolean;
  discrepancies: string[];
  timestamp: string;
  actor: string;
}

export interface InvoiceLifecycleEvent {
  id: string;
  invoiceId: string;
  event: "invoice_generated" | "invoice_issued" | "invoice_paid" | "invoice_voided";
  timestamp: string;
  actor: string;
  previousStatus?: InvoiceStatus;
  newStatus: InvoiceStatus;
  metadata?: Record<string, any>;
}

// WMS (Warehouse Management System) Types
export type BinStatus = "Available" | "Full" | "Reserved" | "Damaged";
export type OrderStatus = "Pending" | "Ready" | "Picking" | "Packed" | "Shipped" | "Delivered";
export type WaveStatus = "Draft" | "Released" | "In Progress" | "Completed" | "Cancelled";
export type PickStatus = "Pending" | "In Progress" | "Picked" | "Not Found" | "Exception";

export interface Bin {
  id: string;
  location: string;
  zone: string;
  capacity: number;
  currentCount: number;
  status: BinStatus;
  assignedSKUs: string[];
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  variant?: string;
  description: string;
  binId: string;
  quantity: number;
  trackingId?: string;
  receivedDate: string;
}

export interface PurchaseOrderLine {
  id: string;
  sku: string;
  variant?: string;
  description: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  status: "Open" | "Receiving" | "Completed" | "Cancelled";
  lines: PurchaseOrderLine[];
  expectedDate: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLine {
  id: string;
  sku: string;
  variant?: string;
  description: string;
  quantity: number;
  pickedQuantity: number;
  binId?: string;
  pickStatus: PickStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  priority: "Low" | "Normal" | "High" | "Urgent";
  lines: OrderLine[];
  waveId?: string;
  zone?: string;
  createdAt: string;
  dueDate: string;
  packedAt?: string;
  shippedAt?: string;
  trackingNumber?: string;
}

export interface Wave {
  id: string;
  waveNumber: string;
  status: WaveStatus;
  orderIds: string[];
  assignedZones: string[];
  assignedPicker?: string;
  createdAt: string;
  releasedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export interface PickTask {
  id: string;
  orderId: string;
  orderLineId: string;
  waveId: string;
  sku: string;
  variant?: string;
  binLocation: string;
  quantityToPick: number;
  quantityPicked: number;
  status: PickStatus;
  pickerId?: string;
  pickPath: number;
  zone: string;
}

export interface PackoutCarton {
  id: string;
  cartonNumber: string;
  orderId: string;
  items: {
    sku: string;
    variant?: string;
    quantity: number;
    trackingId?: string;
  }[];
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  trackingNumber?: string;
  packedAt: string;
  packedBy: string;
}

export interface WarehouseException {
  id: string;
  type: "Pick Not Found" | "Over Capacity" | "Damaged Item" | "Miscount" | "Other";
  entityId: string;
  entityType: "Order" | "SKU" | "Bin" | "Wave";
  description: string;
  status: "Open" | "Investigating" | "Resolved";
  reportedBy: string;
  reportedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface WMSAuditEvent {
  id: string;
  event: "po_scanned" | "item_received" | "wave_released" | "item_picked" | "carton_packed" | "order_shipped" | "exception_raised";
  entityId: string;
  entityType: "PO" | "Inventory" | "Wave" | "Order" | "Carton" | "Exception";
  actor: string;
  timestamp: string;
  previousState?: any;
  newState?: any;
  metadata?: Record<string, any>;
}

export interface WaveKPIs {
  openOrders: number;
  readyToPick: number;
  exceptionsCount: number;
  activeWaves: number;
  totalPickTasks: number;
  completedPickTasks: number;
  averagePickTime: number;
}

// RMA (Returns Management) Types
export type RMAStatus = "open" | "processed" | "closed";
export type DispositionType = "RESTOCK" | "SCRAP" | "RTV" | "REPAIR";
export type ReasonCode = "DEFECT" | "DAMAGED" | "UNWANTED" | "OTHER";
export type RMALineStatus = "pending" | "posted" | "error";

export interface RMAAccountingAdjustment {
  type: "credit_memo" | "disposal_fee" | "rtv_charge" | "repair_invoice";
  invoice_id?: string;
  gl_journal_id?: string;
  amount: number;
  posted_at?: string;
}

export interface RMALine {
  line_id: string;
  sku: string;
  variant?: string;
  description: string;
  qty: number;
  reason_code: ReasonCode;
  disposition?: DispositionType;
  pricing: {
    unit_price: number;
  };
  costing: {
    unit_cost: number;
  };
  accounting_adjustments: RMAAccountingAdjustment[];
  status: RMALineStatus;
  messages: string[];
  disposition_notes?: string;
  processed_at?: string;
  processed_by?: string;
}

export interface RMA {
  rma_id: string;
  meta: {
    created_at: string;
    created_by: string;
    status: RMAStatus;
    updated_at: string;
    updated_by: string;
  };
  client: {
    account_id: string;
    name: string;
  };
  references: {
    original_invoice_id: string;
  };
  lines: RMALine[];
  return_label_printed?: boolean;
  manager_notes?: string;
  total_credit_amount?: number;
  total_disposal_fees?: number;
}

export interface RMAEvent {
  id: string;
  rma_id: string;
  action: "rma_created" | "rma_processed" | "credit_memo_issued" | "gl_posted" | "disposition_assigned" | "return_label_printed";
  actor: string;
  timestamp: string;
  line_id?: string;
  details?: Record<string, any>;
}

export interface GLJournalEntry {
  id: string;
  journal_date: string;
  description: string;
  reference_type: "rma" | "invoice" | "credit_memo";
  reference_id: string;
  entries: {
    account_code: string;
    account_name: string;
    debit?: number;
    credit?: number;
  }[];
  posted_by: string;
  posted_at: string;
}

export interface CreditMemo {
  id: string;
  credit_memo_number: string;
  client_id: string;
  client_name: string;
  original_invoice_id: string;
  rma_id: string;
  line_items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
  totals: {
    subtotal: number;
    taxes: number;
    total: number;
  };
  issued_date: string;
  created_by: string;
  gl_journal_id?: string;
}

export interface DispositionSimulationResult {
  disposition: DispositionType;
  line: RMALine;
  generated_artifacts: {
    credit_memo?: CreditMemo;
    disposal_invoice?: Invoice;
    rtv_invoice?: Invoice;
    repair_invoice?: Invoice;
    gl_journal?: GLJournalEntry;
  };
  inventory_impact: {
    quantity_change: number;
    value_change: number;
  };
  ar_impact: {
    amount: number;
    account: string;
  };
  status: "success" | "error";
  messages: string[];
}

// V17.1.4 Finance & Payments Types
export type PaymentMethod = 'ach' | 'wire' | 'credit_card' | 'check';
export type PaymentStatus = 'recorded' | 'reconciled' | 'partially_applied' | 'applied';
export type DunningStage = 'reminder_1' | 'reminder_2' | 'final_notice';

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

export interface PaymentAllocation {
  invoice_id: string;
  amount: number;
  applied_at: string;
  applied_by: string;
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
    stage: DunningStage;
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
  stage: DunningStage;
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

export interface RemittanceAdvice {
  id: string;
  payment_id: string;
  client_id: string;
  client_name: string;
  payment_amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  allocations: {
    invoice_number: string;
    invoice_amount: number;
    amount_applied: number;
    remaining_balance: number;
  }[];
  generated_at: string;
  generated_by: string;
  export_digests: {
    pdf?: string;
    csv?: string;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details?: Record<string, any>;
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: QAUser | null;
  currentRole: UserRole;
  consoleEnabled: boolean;
  logs: LogEntry[];
  networkRequests: NetworkRequest[];
  lastError: ErrorReplayData | null;
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  // V17.1.4 Payments State
  paymentReceipts: PaymentReceipt[];
  bankTransactions: BankTransaction[];
  dunningQueue: DunningQueueItem[];
  arAging: ARAging[];
  remittanceAdvices: RemittanceAdvice[];
  // WMS State
  purchaseOrders: PurchaseOrder[];
  inventory: InventoryItem[];
  bins: Bin[];
  orders: Order[];
  waves: Wave[];
  pickTasks: PickTask[];
  cartons: PackoutCarton[];
  exceptions: WarehouseException[];
  auditEvents: WMSAuditEvent[];
  // RMA State
  rmas: RMA[];
  selectedRMA: RMA | null;
  rmaEvents: RMAEvent[];
  creditMemos: CreditMemo[];
  glJournals: GLJournalEntry[];
  currentView: "dashboard" | "invoices" | "finance-dashboard" | "rma-adjustments" | "receiving" | "wave-control" | "picking" | "packout" | "rma-intake" | "rma-manager" | "rma-finance" | "vendor-portal-rma" | "payments-console";
}