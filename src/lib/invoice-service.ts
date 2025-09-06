import { Invoice, InvoiceStatus, InvoiceLifecycleEvent, ExportParityResult, UserRole } from "./types";
import { logEvent, stamp } from "./build-log";

// Pre-stamp version + module for consistent billing logs
const tagBilling = stamp('V17.1.2', 'billing');

// Mock Firestore service for invoice operations
export class InvoiceService {
  private static instance: InvoiceService;
  private invoices: Map<string, Invoice> = new Map();
  private lifecycleEvents: InvoiceLifecycleEvent[] = [];

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  private initializeMockData() {
    const mockInvoices: Invoice[] = [
      {
        id: "inv-001",
        invoiceNumber: "INV-2024-001",
        clientId: "client-001",
        clientName: "Acme Corporation",
        status: "Issued",
        issuedDate: "2024-01-15",
        dueDate: "2024-02-15",
        lineItems: [
          {
            id: "line-001",
            description: "Professional Services Q1",
            quantity: 1,
            unitPrice: 10000,
            amount: 10000
          },
          {
            id: "line-002", 
            description: "Software License",
            quantity: 5,
            unitPrice: 500,
            amount: 2500
          }
        ],
        totals: {
          subtotal: 12500,
          discounts: 500,
          taxes: 1200,
          grandTotal: 13200
        },
        notes: [
          {
            id: "note-001",
            type: "vendor",
            content: "Standard payment terms apply",
            createdAt: "2024-01-15T10:00:00Z",
            createdBy: "vendor-001"
          },
          {
            id: "note-002",
            type: "internal",
            content: "High priority client - process immediately",
            createdAt: "2024-01-15T10:30:00Z",
            createdBy: "admin-001"
          }
        ],
        vendorId: "vendor-001",
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        createdBy: "system",
        updatedBy: "admin-001"
      },
      {
        id: "inv-002",
        invoiceNumber: "INV-2024-002",
        clientId: "client-002",
        clientName: "Tech Solutions Ltd",
        status: "Draft",
        issuedDate: "",
        dueDate: "2024-03-01",
        lineItems: [
          {
            id: "line-003",
            description: "Consulting Services",
            quantity: 10,
            unitPrice: 150,
            amount: 1500
          }
        ],
        totals: {
          subtotal: 1500,
          discounts: 0,
          taxes: 150,
          grandTotal: 1650
        },
        notes: [],
        vendorId: "vendor-002",
        createdAt: "2024-01-20T14:00:00Z",
        updatedAt: "2024-01-20T14:00:00Z",
        createdBy: "vendor-002",
        updatedBy: "vendor-002"
      },
      {
        id: "inv-003",
        invoiceNumber: "INV-2024-003",
        clientId: "client-003",
        clientName: "Global Enterprises",
        status: "Paid",
        issuedDate: "2024-01-10",
        dueDate: "2024-02-10",
        lineItems: [
          {
            id: "line-004",
            description: "Monthly Subscription",
            quantity: 1,
            unitPrice: 5000,
            amount: 5000
          }
        ],
        totals: {
          subtotal: 5000,
          discounts: 250,
          taxes: 475,
          grandTotal: 5225
        },
        notes: [
          {
            id: "note-003",
            type: "vendor",
            content: "Payment received via wire transfer",
            createdAt: "2024-02-08T16:00:00Z",
            createdBy: "vendor-001"
          }
        ],
        vendorId: "vendor-001",
        createdAt: "2024-01-10T08:00:00Z",
        updatedAt: "2024-02-08T16:00:00Z",
        createdBy: "system",
        updatedBy: "finance-001"
      }
    ];

    mockInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
    });

    tagBilling('mock_data_initialized', { invoiceCount: mockInvoices.length });
  }

  async getInvoices(userRole: UserRole, vendorId?: string): Promise<Invoice[]> {
    try {
      let filteredInvoices = Array.from(this.invoices.values());

      // Apply role-based filtering
      if (userRole === "Vendor" && vendorId) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.vendorId === vendorId);
      }

      tagBilling('invoices_retrieved', { count: filteredInvoices.length, userRole });
      return filteredInvoices;
    } catch (error) {
      tagBilling('invoices_retrieval_failed', { error: String(error), userRole }, 'system');
      throw error;
    }
  }

  async getInvoiceById(id: string, userRole: UserRole, vendorId?: string): Promise<Invoice | null> {
    try {
      const invoice = this.invoices.get(id);
      
      if (!invoice) {
        tagBilling('invoice_not_found', { invoiceId: id }, 'system');
        return null;
      }

      // Apply role-based access control
      if (userRole === "Vendor" && vendorId && invoice.vendorId !== vendorId) {
        tagBilling('invoice_access_denied', { invoiceId: id, vendorId }, 'system');
        return null;
      }

      tagBilling('invoice_retrieved', { invoiceId: id }, 'system');
      return invoice;
    } catch (error) {
      tagBilling('invoice_retrieval_failed', { invoiceId: id, error: String(error) }, 'system');
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId: string, newStatus: InvoiceStatus, actor: string): Promise<void> {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      const previousStatus = invoice.status;
      invoice.status = newStatus;
      invoice.updatedAt = new Date().toISOString();
      invoice.updatedBy = actor;

      // Log lifecycle event
      const lifecycleEvent: InvoiceLifecycleEvent = {
        id: `event-${Date.now()}`,
        invoiceId,
        event: this.getLifecycleEventType(newStatus),
        timestamp: new Date().toISOString(),
        actor,
        previousStatus,
        newStatus,
        metadata: { invoiceNumber: invoice.invoiceNumber }
      };

      this.lifecycleEvents.push(lifecycleEvent);
      this.invoices.set(invoiceId, invoice);

      tagBilling('invoice_status_updated', { 
        invoiceId, 
        previousStatus, 
        newStatus,
        invoiceNumber: invoice.invoiceNumber 
      }, actor);
    } catch (error) {
      tagBilling('invoice_status_update_failed', { 
        invoiceId, 
        error: String(error) 
      }, actor);
      throw error;
    }
  }

  private getLifecycleEventType(status: InvoiceStatus): InvoiceLifecycleEvent["event"] {
    switch (status) {
      case "Draft": return "invoice_generated";
      case "Issued": return "invoice_issued";
      case "Paid": return "invoice_paid";
      case "Void": return "invoice_voided";
      default: return "invoice_generated";
    }
  }

  async exportInvoice(invoiceId: string, format: "PDF" | "Excel" | "CSV", actor: string): Promise<Blob> {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Mock export generation
      const exportData = this.generateExportData(invoice, format);
      const blob = new Blob([exportData], { 
        type: this.getContentType(format) 
      });

      tagBilling('invoice_exported', { invoiceId, format }, actor);
      return blob;
    } catch (error) {
      tagBilling('invoice_export_failed', { 
        invoiceId, 
        format, 
        error: String(error) 
      }, actor);
      throw error;
    }
  }

  async validateExportParity(invoiceId: string, actor: string): Promise<ExportParityResult[]> {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      const formats: ("PDF" | "Excel" | "CSV")[] = ["PDF", "Excel", "CSV"];
      const results: ExportParityResult[] = [];

      for (const format of formats) {
        // Mock parity validation
        const totalsMatch = Math.random() > 0.1; // 90% success rate for demo
        const discrepancies = totalsMatch ? [] : [`${format} totals mismatch by $0.01`];

        results.push({
          format,
          totalsMatch,
          discrepancies,
          timestamp: new Date().toISOString(),
          actor
        });
      }

      tagBilling('export_parity_validated', { 
        invoiceId, 
        resultsCount: results.length 
      }, actor);
      return results;
    } catch (error) {
      tagBilling('export_parity_validation_failed', { 
        invoiceId, 
        error: String(error) 
      }, actor);
      throw error;
    }
  }

  private generateExportData(invoice: Invoice, format: "PDF" | "Excel" | "CSV"): string {
    switch (format) {
      case "PDF":
        return `%PDF-1.4\n% Mock PDF content for ${invoice.invoiceNumber}`;
      case "Excel":
        return `Invoice Number,Client,Status,Amount\n${invoice.invoiceNumber},${invoice.clientName},${invoice.status},${invoice.totals.grandTotal}`;
      case "CSV":
        return `"Invoice Number","Client","Status","Amount"\n"${invoice.invoiceNumber}","${invoice.clientName}","${invoice.status}","${invoice.totals.grandTotal}"`;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private getContentType(format: "PDF" | "Excel" | "CSV"): string {
    switch (format) {
      case "PDF": return "application/pdf";
      case "Excel": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "CSV": return "text/csv";
      default: return "text/plain";
    }
  }

  getLifecycleEvents(): InvoiceLifecycleEvent[] {
    return [...this.lifecycleEvents];
  }
}

export const invoiceService = InvoiceService.getInstance();