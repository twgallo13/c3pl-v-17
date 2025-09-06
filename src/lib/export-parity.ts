/**
 * C3PL V17.1.3 Export Parity Service
 * Ensures consistency between UI totals and exported file totals with SHA-256 hashing
 */

import { logEvent, stamp } from './build-log';

const tag = stamp('V17.1.3', 'export-parity');

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export interface ExportDigest {
  format: ExportFormat;
  hash: string;           // SHA-256 hash of export payload
  totals: ExportTotals;
  generatedAt: string;    // ISO timestamp
}

export interface ExportTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscounts: number;
  taxAmount: number;
  grandTotal: number;
  lineCount: number;
}

export interface ExportParityResult {
  invoiceId: string;
  format: ExportFormat;
  uiTotals: ExportTotals;
  exportTotals: ExportTotals;
  digest: string;
  matches: boolean;
  discrepancies?: ExportDiscrepancy[];
}

export interface ExportDiscrepancy {
  field: keyof ExportTotals;
  uiValue: number;
  exportValue: number;
  difference: number;
}

/**
 * Generate export file and verify parity with UI totals
 */
export async function generateExportWithParity(
  invoiceId: string,
  format: ExportFormat,
  uiTotals: ExportTotals,
  exportData: any // The actual export data (invoice object, line items, etc.)
): Promise<ExportParityResult> {
  try {
    // Generate the export file content
    const exportContent = await generateExportContent(format, exportData);
    
    // Extract totals from export content
    const exportTotals = extractTotalsFromExport(format, exportContent);
    
    // Generate SHA-256 hash of export content
    const digest = await generateSHA256Hash(exportContent);
    
    // Compare totals
    const parityResult = compareExportTotals(invoiceId, format, uiTotals, exportTotals, digest);
    
    // Store digest on invoice (simulate Firestore update)
    await storeExportDigest(invoiceId, {
      format,
      hash: digest,
      totals: exportTotals,
      generatedAt: new Date().toISOString()
    });
    
    // Log result
    tag('export_generated', {
      invoiceId,
      format,
      matches: parityResult.matches,
      digest: digest.substring(0, 8), // First 8 chars for logging
      discrepancyCount: parityResult.discrepancies?.length || 0
    });
    
    if (!parityResult.matches) {
      tag('export_parity_failed', {
        invoiceId,
        format,
        discrepancies: parityResult.discrepancies
      });
      
      throw new ExportParityError(
        `Export parity check failed for invoice ${invoiceId} (${format})`,
        parityResult.discrepancies || []
      );
    }
    
    tag('export_parity_passed', {
      invoiceId,
      format,
      digest: digest.substring(0, 8)
    });
    
    return parityResult;
    
  } catch (error) {
    tag('export_generation_failed', {
      invoiceId,
      format,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Custom error class for export parity failures
 */
export class ExportParityError extends Error {
  constructor(
    message: string,
    public discrepancies: ExportDiscrepancy[]
  ) {
    super(message);
    this.name = 'ExportParityError';
  }
}

/**
 * Generate export content based on format
 */
async function generateExportContent(format: ExportFormat, data: any): Promise<string> {
  switch (format) {
    case 'pdf':
      return generatePDFContent(data);
    case 'csv':
      return generateCSVContent(data);
    case 'xlsx':
      return generateXLSXContent(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate PDF content (simplified - in real app would use PDF library)
 */
function generatePDFContent(data: any): string {
  // Simplified PDF-like content for demo
  const lines = [
    `Invoice: ${data.invoiceNumber}`,
    `Client: ${data.client.name}`,
    `Date: ${data.issuedDate}`,
    '',
    'Line Items:',
    ...data.lineItems.map((item: any) => 
      `${item.sku} - ${item.description} - Qty: ${item.qty} - Price: $${item.unitPrice.toFixed(2)} - Total: $${(item.qty * item.unitPrice).toFixed(2)}`
    ),
    '',
    `Subtotal: $${data.totals.subtotal.toFixed(2)}`,
    `Discount: -$${data.totals.discountAmount.toFixed(2)}`,
    `After Discounts: $${data.totals.afterDiscounts.toFixed(2)}`,
    `Tax: $${data.totals.taxAmount.toFixed(2)}`,
    `Grand Total: $${data.totals.grandTotal.toFixed(2)}`
  ];
  
  return lines.join('\n');
}

/**
 * Generate CSV content
 */
function generateCSVContent(data: any): string {
  const lines = [
    'Type,Field,Value',
    `Header,Invoice,${data.invoiceNumber}`,
    `Header,Client,${data.client.name}`,
    `Header,Date,${data.issuedDate}`,
    '',
    'SKU,Description,Quantity,Unit Price,Line Total'
  ];
  
  // Add line items
  data.lineItems.forEach((item: any) => {
    lines.push(`${item.sku},${item.description},${item.qty},${item.unitPrice.toFixed(2)},${(item.qty * item.unitPrice).toFixed(2)}`);
  });
  
  // Add totals
  lines.push('');
  lines.push(`Total,Subtotal,${data.totals.subtotal.toFixed(2)}`);
  lines.push(`Total,Discount,${data.totals.discountAmount.toFixed(2)}`);
  lines.push(`Total,After Discounts,${data.totals.afterDiscounts.toFixed(2)}`);
  lines.push(`Total,Tax,${data.totals.taxAmount.toFixed(2)}`);
  lines.push(`Total,Grand Total,${data.totals.grandTotal.toFixed(2)}`);
  
  return lines.join('\n');
}

/**
 * Generate XLSX content (simplified - in real app would use XLSX library)
 */
function generateXLSXContent(data: any): string {
  // Simplified XLSX-like content for demo
  const content = {
    invoice: data.invoiceNumber,
    client: data.client.name,
    date: data.issuedDate,
    lineItems: data.lineItems,
    totals: data.totals
  };
  
  return JSON.stringify(content, null, 2);
}

/**
 * Extract totals from export content
 */
function extractTotalsFromExport(format: ExportFormat, content: string): ExportTotals {
  // In a real implementation, this would parse the actual export format
  // For demo purposes, we'll extract from structured content
  
  const subtotalMatch = content.match(/Subtotal:?\s*\$?(\d+\.?\d*)/i);
  const discountMatch = content.match(/Discount:?\s*-?\$?(\d+\.?\d*)/i);
  const afterDiscountsMatch = content.match(/After Discounts:?\s*\$?(\d+\.?\d*)/i);
  const taxMatch = content.match(/Tax:?\s*\$?(\d+\.?\d*)/i);
  const grandTotalMatch = content.match(/Grand Total:?\s*\$?(\d+\.?\d*)/i);
  
  // Count line items (simple heuristic)
  const lineCount = (content.match(/Qty:\s*\d+/g) || []).length;
  
  return {
    subtotal: parseFloat(subtotalMatch?.[1] || '0'),
    discountAmount: parseFloat(discountMatch?.[1] || '0'),
    afterDiscounts: parseFloat(afterDiscountsMatch?.[1] || '0'),
    taxAmount: parseFloat(taxMatch?.[1] || '0'),
    grandTotal: parseFloat(grandTotalMatch?.[1] || '0'),
    lineCount
  };
}

/**
 * Generate SHA-256 hash of content
 */
async function generateSHA256Hash(content: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare export totals with UI totals
 */
function compareExportTotals(
  invoiceId: string,
  format: ExportFormat,
  uiTotals: ExportTotals,
  exportTotals: ExportTotals,
  digest: string
): ExportParityResult {
  const discrepancies: ExportDiscrepancy[] = [];
  const tolerance = 0.01; // Allow 1 cent tolerance for rounding differences
  
  // Check each total field
  const fields: (keyof ExportTotals)[] = ['subtotal', 'discountAmount', 'afterDiscounts', 'taxAmount', 'grandTotal', 'lineCount'];
  
  for (const field of fields) {
    const uiValue = uiTotals[field];
    const exportValue = exportTotals[field];
    const difference = Math.abs(uiValue - exportValue);
    
    if (difference > tolerance) {
      discrepancies.push({
        field,
        uiValue,
        exportValue,
        difference
      });
    }
  }
  
  return {
    invoiceId,
    format,
    uiTotals,
    exportTotals,
    digest,
    matches: discrepancies.length === 0,
    discrepancies: discrepancies.length > 0 ? discrepancies : undefined
  };
}

/**
 * Store export digest on invoice (simulate Firestore update)
 */
async function storeExportDigest(invoiceId: string, digest: ExportDigest): Promise<void> {
  // In real app, this would update Firestore
  const exportRecord = {
    invoiceId,
    exports: {
      [`last_${digest.format}_at`]: digest.generatedAt,
      digest: {
        [digest.format]: digest.hash
      }
    }
  };
  
  console.info('[EXPORT-DIGEST]', exportRecord);
  
  tag('export_digest_stored', {
    invoiceId,
    format: digest.format,
    hash: digest.hash.substring(0, 8)
  });
}

/**
 * Check export parity for existing invoice
 */
export async function checkExportParity(
  invoiceId: string,
  format: ExportFormat,
  uiTotals: ExportTotals
): Promise<ExportParityResult> {
  // In real app, would fetch stored export digest from Firestore
  // For demo, simulate checking parity
  
  const mockExportTotals: ExportTotals = {
    ...uiTotals,
    // Simulate potential discrepancy
    grandTotal: uiTotals.grandTotal + (Math.random() > 0.8 ? 0.01 : 0)
  };
  
  const mockDigest = await generateSHA256Hash(JSON.stringify(mockExportTotals));
  
  return compareExportTotals(invoiceId, format, uiTotals, mockExportTotals, mockDigest);
}