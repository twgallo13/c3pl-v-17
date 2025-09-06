export const VERSION = "V17.1.0" as const;

export type UserRole = "Vendor" | "Account Manager" | "Customer Service" | "Operations" | "Admin" | "Finance";

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
}