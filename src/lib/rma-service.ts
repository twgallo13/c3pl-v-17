/**
 * C3PL V17.1.3 RMA Service
 * End-to-end Returns Management with Firestore contracts and GL audit links
 */

import { 
  RMA, 
  RMALine, 
  RMAEvent, 
  CreditMemo, 
  GLJournalEntry, 
  Invoice,
  DispositionType, 
  ReasonCode, 
  DispositionSimulationResult,
  UserRole 
} from "./types";
import { logEvent, stamp } from "./build-log";
import { logRMAEventLegacy } from "./rma-logger";
import { rbacService } from "./rbac";

// Pre-stamp version + module for consistent RMA logs
const tagRMA = stamp('V17.1.3', 'rma');

export class RMAService {
  private static instance: RMAService;
  private rmas: Map<string, RMA> = new Map();
  private rmaEvents: RMAEvent[] = [];
  private creditMemos: Map<string, CreditMemo> = new Map();
  private glJournals: Map<string, GLJournalEntry> = new Map();
  private nextRMAId = 1;
  private nextCreditId = 1;
  private nextGLId = 1;

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): RMAService {
    if (!RMAService.instance) {
      RMAService.instance = new RMAService();
    }
    return RMAService.instance;
  }

  private initializeMockData() {
    // Create sample RMAs for testing
    const sampleRMA: RMA = {
      rma_id: "RMA-2024-001",
      meta: {
        created_at: "2024-01-20T10:00:00Z",
        created_by: "associate-001",
        status: "open",
        updated_at: "2024-01-20T10:00:00Z",
        updated_by: "associate-001"
      },
      client: {
        account_id: "client-001",
        name: "Acme Corporation"
      },
      references: {
        original_invoice_id: "inv-001"
      },
      lines: [
        {
          line_id: "rma-line-001",
          sku: "WIDGET-001",
          variant: "RED",
          description: "Premium Widget - Red",
          qty: 2,
          reason_code: "DEFECT",
          pricing: { unit_price: 150 },
          costing: { unit_cost: 75 },
          accounting_adjustments: [],
          status: "pending",
          messages: []
        }
      ],
      return_label_printed: true
    };

    this.rmas.set(sampleRMA.rma_id, sampleRMA);
    
    // Log initial event
    this.addRMAEvent(sampleRMA.rma_id, "rma_created", "associate-001", {
      client: sampleRMA.client.name,
      lineCount: sampleRMA.lines.length
    });

    tagRMA('mock_data_initialized', { rmaCount: 1 });
  }

  // Create new RMA
  async createRMA(
    clientId: string,
    clientName: string,
    originalInvoiceId: string,
    actor: string,
    userRole: UserRole
  ): Promise<string> {
    try {
      // RBAC check
      rbacService.serverGuard(userRole, "rma:create", actor);

      const rmaId = `RMA-2024-${String(this.nextRMAId++).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const rma: RMA = {
        rma_id: rmaId,
        meta: {
          created_at: now,
          created_by: actor,
          status: "open",
          updated_at: now,
          updated_by: actor
        },
        client: {
          account_id: clientId,
          name: clientName
        },
        references: {
          original_invoice_id: originalInvoiceId
        },
        lines: []
      };

      this.rmas.set(rmaId, rma);
      this.addRMAEvent(rmaId, "rma_created", actor, {
        client: clientName,
        originalInvoice: originalInvoiceId
      });

      tagRMA('rma_created', { rmaId, clientName, originalInvoiceId }, actor);
      return rmaId;
    } catch (error) {
      tagRMA('rma_creation_failed', { error: String(error) }, actor);
      throw error;
    }
  }

  // Add line to RMA
  async addRMALine(
    rmaId: string,
    sku: string,
    variant: string | undefined,
    description: string,
    qty: number,
    reasonCode: ReasonCode,
    unitPrice: number,
    unitCost: number,
    actor: string,
    userRole: UserRole
  ): Promise<string> {
    try {
      rbacService.serverGuard(userRole, "rma:create", actor);

      const rma = this.rmas.get(rmaId);
      if (!rma) {
        throw new Error(`RMA not found: ${rmaId}`);
      }

      const lineId = `${rmaId}-line-${rma.lines.length + 1}`;
      const rmaLine: RMALine = {
        line_id: lineId,
        sku,
        variant,
        description,
        qty,
        reason_code: reasonCode,
        pricing: { unit_price: unitPrice },
        costing: { unit_cost: unitCost },
        accounting_adjustments: [],
        status: "pending",
        messages: []
      };

      rma.lines.push(rmaLine);
      rma.meta.updated_at = new Date().toISOString();
      rma.meta.updated_by = actor;

      this.rmas.set(rmaId, rma);
      
      tagRMA('rma_line_added', { 
        rmaId, 
        lineId, 
        sku, 
        qty, 
        reasonCode 
      }, actor);

      return lineId;
    } catch (error) {
      tagRMA('rma_line_add_failed', { 
        rmaId, 
        sku, 
        error: String(error) 
      }, actor);
      throw error;
    }
  }

  // Process disposition for RMA line
  async processDisposition(
    rmaId: string,
    lineId: string,
    disposition: DispositionType,
    notes: string,
    actor: string,
    userRole: UserRole
  ): Promise<{ invoiceId?: string; creditId?: string; glJournalId?: string }> {
    try {
      rbacService.serverGuard(userRole, "rma:disposition", actor);

      const rma = this.rmas.get(rmaId);
      if (!rma) {
        throw new Error(`RMA not found: ${rmaId}`);
      }

      const line = rma.lines.find(l => l.line_id === lineId);
      if (!line) {
        throw new Error(`RMA line not found: ${lineId}`);
      }

      // Process based on disposition type
      const result = await this.executeDisposition(rma, line, disposition, notes, actor);
      
      // Update line with disposition and accounting adjustments
      line.disposition = disposition;
      line.disposition_notes = notes;
      line.accounting_adjustments = result.adjustments;
      line.status = "posted";
      line.processed_at = new Date().toISOString();
      line.processed_by = actor;

      // Update RMA
      rma.meta.updated_at = new Date().toISOString();
      rma.meta.updated_by = actor;
      this.rmas.set(rmaId, rma);

      // Log events
      this.addRMAEvent(rmaId, "disposition_assigned", actor, {
        lineId,
        disposition,
        artifacts: result
      });

      tagRMA('disposition_processed', {
        rmaId,
        lineId, 
        disposition,
        artifactIds: result
      }, actor);

      return result;
    } catch (error) {
      tagRMA('disposition_processing_failed', {
        rmaId,
        lineId,
        disposition,
        error: String(error)
      }, actor);
      throw error;
    }
  }

  // Execute specific disposition logic
  private async executeDisposition(
    rma: RMA,
    line: RMALine,
    disposition: DispositionType,
    notes: string,
    actor: string
  ): Promise<{ 
    invoiceId?: string; 
    creditId?: string; 
    glJournalId?: string;
    adjustments: any[]
  }> {
    const now = new Date().toISOString();
    const totalValue = line.qty * line.pricing.unit_price;
    const totalCost = line.qty * line.costing.unit_cost;

    switch (disposition) {
      case "RESTOCK": {
        // Create credit memo
        const creditId = await this.createCreditMemo(rma, line, actor);
        
        // Create GL journal for credit and inventory adjustment
        const glJournalId = await this.createGLJournal([
          { account_code: "1200", account_name: "Accounts Receivable", credit: totalValue },
          { account_code: "4000", account_name: "Revenue", debit: totalValue },
          { account_code: "1300", account_name: "Inventory", debit: totalCost },
          { account_code: "5000", account_name: "Cost of Goods Sold", credit: totalCost }
        ], "rma", rma.rma_id, `RESTOCK: ${line.sku} x${line.qty}`, actor);

        return {
          creditId,
          glJournalId,
          adjustments: [{
            type: "credit_memo",
            invoice_id: creditId,
            gl_journal_id: glJournalId,
            amount: totalValue,
            posted_at: now
          }]
        };
      }

      case "SCRAP": {
        // Optional disposal fee (20% of cost)
        const disposalFee = totalCost * 0.2;
        const invoiceId = await this.createDisposalInvoice(rma, line, disposalFee, actor);
        
        // GL: Write off inventory, record disposal expense
        const glJournalId = await this.createGLJournal([
          { account_code: "6500", account_name: "Disposal Expense", debit: totalCost },
          { account_code: "1300", account_name: "Inventory", credit: totalCost },
          { account_code: "1200", account_name: "Accounts Receivable", debit: disposalFee },
          { account_code: "4500", account_name: "Disposal Revenue", credit: disposalFee }
        ], "rma", rma.rma_id, `SCRAP: ${line.sku} x${line.qty}`, actor);

        return {
          invoiceId,
          glJournalId,
          adjustments: [{
            type: "disposal_fee",
            invoice_id: invoiceId,
            gl_journal_id: glJournalId,
            amount: disposalFee,
            posted_at: now
          }]
        };
      }

      case "RTV": {
        // Return to vendor charge (vendor cost + 15% handling)
        const rtvCharge = totalCost * 1.15;
        const invoiceId = await this.createRTVInvoice(rma, line, rtvCharge, actor);
        
        // GL: Charge RTV fee, no inventory change
        const glJournalId = await this.createGLJournal([
          { account_code: "1200", account_name: "Accounts Receivable", debit: rtvCharge },
          { account_code: "4600", account_name: "RTV Revenue", credit: rtvCharge }
        ], "rma", rma.rma_id, `RTV: ${line.sku} x${line.qty}`, actor);

        return {
          invoiceId,
          glJournalId,
          adjustments: [{
            type: "rtv_charge",
            invoice_id: invoiceId,
            gl_journal_id: glJournalId,
            amount: rtvCharge,
            posted_at: now
          }]
        };
      }

      case "REPAIR": {
        // Repair labor charge (30% of original price)
        const repairCharge = totalValue * 0.3;
        const invoiceId = await this.createRepairInvoice(rma, line, repairCharge, actor);
        
        // GL: Labor revenue, adjust COGS for parts if used
        const partsUsed = totalCost * 0.1; // 10% parts cost
        const glJournalId = await this.createGLJournal([
          { account_code: "1200", account_name: "Accounts Receivable", debit: repairCharge },
          { account_code: "4700", account_name: "Repair Revenue", credit: repairCharge },
          { account_code: "5100", account_name: "Repair Parts Cost", debit: partsUsed },
          { account_code: "1300", account_name: "Inventory", credit: partsUsed }
        ], "rma", rma.rma_id, `REPAIR: ${line.sku} x${line.qty}`, actor);

        return {
          invoiceId,
          glJournalId,
          adjustments: [{
            type: "repair_invoice",
            invoice_id: invoiceId,
            gl_journal_id: glJournalId,
            amount: repairCharge,
            posted_at: now
          }]
        };
      }

      default:
        throw new Error(`Unsupported disposition: ${disposition}`);
    }
  }

  // Create credit memo
  private async createCreditMemo(rma: RMA, line: RMALine, actor: string): Promise<string> {
    const creditId = `CM-2024-${String(this.nextCreditId++).padStart(3, '0')}`;
    const amount = line.qty * line.pricing.unit_price;
    
    const creditMemo: CreditMemo = {
      id: creditId,
      credit_memo_number: creditId,
      client_id: rma.client.account_id,
      client_name: rma.client.name,
      original_invoice_id: rma.references.original_invoice_id,
      rma_id: rma.rma_id,
      line_items: [{
        id: `${creditId}-line-1`,
        description: `Return Credit: ${line.description}`,
        quantity: line.qty,
        unit_price: line.pricing.unit_price,
        amount
      }],
      totals: {
        subtotal: amount,
        taxes: amount * 0.1, // 10% tax
        total: amount * 1.1
      },
      issued_date: new Date().toISOString(),
      created_by: actor
    };

    this.creditMemos.set(creditId, creditMemo);
    this.addRMAEvent(rma.rma_id, "credit_memo_issued", actor, { creditId, amount });
    
    return creditId;
  }

  // Create disposal fee invoice
  private async createDisposalInvoice(rma: RMA, line: RMALine, fee: number, actor: string): Promise<string> {
    return this.createServiceInvoice(rma, line, fee, "Disposal Fee", "disposal", actor);
  }

  // Create RTV charge invoice  
  private async createRTVInvoice(rma: RMA, line: RMALine, charge: number, actor: string): Promise<string> {
    return this.createServiceInvoice(rma, line, charge, "Return to Vendor Handling", "rtv", actor);
  }

  // Create repair labor invoice
  private async createRepairInvoice(rma: RMA, line: RMALine, charge: number, actor: string): Promise<string> {
    return this.createServiceInvoice(rma, line, charge, "Repair Services", "repair", actor);
  }

  // Generic service invoice creation
  private async createServiceInvoice(
    rma: RMA, 
    line: RMALine, 
    amount: number, 
    description: string, 
    type: string,
    actor: string
  ): Promise<string> {
    const invoiceId = `INV-${type.toUpperCase()}-${String(this.nextRMAId).padStart(3, '0')}`;
    
    // This would integrate with invoice service in real implementation
    tagRMA(`${type}_invoice_created`, { 
      invoiceId, 
      rmaId: rma.rma_id, 
      amount,
      lineId: line.line_id 
    }, actor);
    
    return invoiceId;
  }

  // Create GL journal entry
  private async createGLJournal(
    entries: Array<{account_code: string; account_name: string; debit?: number; credit?: number}>,
    referenceType: "rma" | "invoice" | "credit_memo",
    referenceId: string,
    description: string,
    actor: string
  ): Promise<string> {
    const journalId = `GL-2024-${String(this.nextGLId++).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const journal: GLJournalEntry = {
      id: journalId,
      journal_date: now,
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      entries,
      posted_by: actor,
      posted_at: now
    };

    this.glJournals.set(journalId, journal);
    this.addRMAEvent(referenceId, "gl_posted", actor, { journalId, description });

    return journalId;
  }

  // Add RMA event
  private addRMAEvent(
    rmaId: string,
    action: RMAEvent["action"],
    actor: string,
    details?: Record<string, any>,
    lineId?: string
  ) {
    const event: RMAEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rma_id: rmaId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      line_id: lineId,
      details
    };

    this.rmaEvents.push(event);
    logRMAEventLegacy(rmaId, action, actor, details);
  }

  // Simulate disposition for testing
  async simulateDisposition(
    line: RMALine,
    disposition: DispositionType,
    actor: string
  ): Promise<DispositionSimulationResult> {
    try {
      const totalValue = line.qty * line.pricing.unit_price;
      const totalCost = line.qty * line.costing.unit_cost;

      // Simulate the disposition without actually creating records
      const result: DispositionSimulationResult = {
        disposition,
        line,
        generated_artifacts: {},
        inventory_impact: { quantity_change: 0, value_change: 0 },
        ar_impact: { amount: 0, account: "" },
        status: "success",
        messages: []
      };

      switch (disposition) {
        case "RESTOCK":
          result.inventory_impact = { quantity_change: line.qty, value_change: totalCost };
          result.ar_impact = { amount: -totalValue, account: "Credit to customer" };
          result.messages.push(`Will credit customer $${totalValue.toFixed(2)}`);
          result.messages.push(`Will increase inventory by ${line.qty} units worth $${totalCost.toFixed(2)}`);
          break;

        case "SCRAP":
          const disposalFee = totalCost * 0.2;
          result.inventory_impact = { quantity_change: -line.qty, value_change: -totalCost };
          result.ar_impact = { amount: disposalFee, account: "Disposal fee invoice" };
          result.messages.push(`Will write off inventory worth $${totalCost.toFixed(2)}`);
          result.messages.push(`Will charge disposal fee of $${disposalFee.toFixed(2)}`);
          break;

        case "RTV":
          const rtvCharge = totalCost * 1.15;
          result.ar_impact = { amount: rtvCharge, account: "RTV handling fee" };
          result.messages.push(`Will charge RTV handling fee of $${rtvCharge.toFixed(2)}`);
          result.messages.push("No inventory impact - item returned to vendor");
          break;

        case "REPAIR":
          const repairCharge = totalValue * 0.3;
          const partsUsed = totalCost * 0.1;
          result.inventory_impact = { quantity_change: 0, value_change: -partsUsed };
          result.ar_impact = { amount: repairCharge, account: "Repair labor invoice" };
          result.messages.push(`Will charge repair fee of $${repairCharge.toFixed(2)}`);
          result.messages.push(`Estimated parts cost: $${partsUsed.toFixed(2)}`);
          break;
      }

      tagRMA('disposition_simulated', { 
        disposition, 
        sku: line.sku, 
        results: result 
      }, actor);

      return result;
    } catch (error) {
      tagRMA('disposition_simulation_failed', { 
        disposition, 
        sku: line.sku, 
        error: String(error) 
      }, actor);
      
      throw error;
    }
  }

  // Get RMAs with role-based filtering
  async getRMAs(userRole: UserRole, vendorId?: string): Promise<RMA[]> {
    let filtered = Array.from(this.rmas.values());
    
    if (userRole === "Vendor" && vendorId) {
      // Vendors can only see RMAs related to their invoices
      // In real implementation, this would query invoice service
      filtered = filtered.filter(rma => 
        rma.references.original_invoice_id.includes(vendorId)
      );
    }

    return filtered;
  }

  // Get RMA by ID with access control
  async getRMAById(rmaId: string, userRole: UserRole, vendorId?: string): Promise<RMA | null> {
    const rma = this.rmas.get(rmaId);
    if (!rma) return null;

    if (userRole === "Vendor" && vendorId) {
      // Check if vendor has access to this RMA's original invoice
      if (!rma.references.original_invoice_id.includes(vendorId)) {
        return null;
      }
    }

    return rma;
  }

  // Get RMA events
  getRMAEvents(rmaId?: string): RMAEvent[] {
    if (rmaId) {
      return this.rmaEvents.filter(e => e.rma_id === rmaId);
    }
    return [...this.rmaEvents];
  }

  // Get credit memos 
  getCreditMemos(): CreditMemo[] {
    return Array.from(this.creditMemos.values());
  }

  // Get GL journals
  getGLJournals(): GLJournalEntry[] {
    return Array.from(this.glJournals.values());
  }
}

export const rmaService = RMAService.getInstance();