export const VERSION = "V17.1.1" as const;

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
  currentView: "dashboard" | "invoices" | "receiving" | "wave-control" | "picking" | "packout";
}