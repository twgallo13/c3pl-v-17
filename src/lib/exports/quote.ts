// V17.2.0 — Quote Export Service
import { logEvent, stamp } from '@/lib/build-log';
import { QuoteResult, QuoteInput } from '@/lib/types';

const tag = stamp('V17.2.0', 'quoting');

export interface QuoteExportDigests {
  pdf?: string;
  csv?: string;
  xlsx?: string;
  last_pdf_at?: string;
  last_csv_at?: string;
  last_xlsx_at?: string;
}

export interface ExportResult {
  format: 'PDF' | 'CSV' | 'XLSX';
  data: Blob | string;
  digest: string;
  timestamp: string;
}

export class QuoteExportService {
  async exportPDF(quote: QuoteResult, input: QuoteInput): Promise<ExportResult> {
    try {
      const pdfContent = this.generatePDFContent(quote, input);
      const digest = await this.generateDigest(pdfContent);
      const timestamp = new Date().toISOString();

      // In a real implementation, this would generate an actual PDF
      const mockPDFBlob = new Blob([pdfContent], { type: 'application/pdf' });

      tag('quote_exported', { 
        format: 'PDF', 
        lineCount: quote.lines.length,
        grandTotal: quote.totals.grand_total,
        digest 
      });

      return {
        format: 'PDF',
        data: mockPDFBlob,
        digest,
        timestamp
      };
    } catch (error) {
      tag('quote_export_failed', { format: 'PDF', error: error.message });
      throw error;
    }
  }

  async exportCSV(quote: QuoteResult, input: QuoteInput): Promise<ExportResult> {
    try {
      const csvContent = this.generateCSVContent(quote, input);
      const digest = await this.generateDigest(csvContent);
      const timestamp = new Date().toISOString();

      tag('quote_exported', { 
        format: 'CSV', 
        lineCount: quote.lines.length,
        grandTotal: quote.totals.grand_total,
        digest 
      });

      return {
        format: 'CSV',
        data: csvContent,
        digest,
        timestamp
      };
    } catch (error) {
      tag('quote_export_failed', { format: 'CSV', error: error.message });
      throw error;
    }
  }

  async exportXLSX(quote: QuoteResult, input: QuoteInput): Promise<ExportResult> {
    try {
      const xlsxContent = this.generateXLSXContent(quote, input);
      const digest = await this.generateDigest(xlsxContent);
      const timestamp = new Date().toISOString();

      // In a real implementation, this would generate an actual XLSX file
      const mockXLSXBlob = new Blob([xlsxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      tag('quote_exported', { 
        format: 'XLSX', 
        lineCount: quote.lines.length,
        grandTotal: quote.totals.grand_total,
        digest 
      });

      return {
        format: 'XLSX',
        data: mockXLSXBlob,
        digest,
        timestamp
      };
    } catch (error) {
      tag('quote_export_failed', { format: 'XLSX', error: error.message });
      throw error;
    }
  }

  async validateExportParity(quote: QuoteResult, exports: ExportResult[]): Promise<{
    passed: boolean;
    discrepancies: string[];
    timestamp: string;
  }> {
    try {
      const discrepancies: string[] = [];
      const uiGrandTotal = quote.totals.grand_total;

      for (const exportResult of exports) {
        const exportTotal = this.extractTotalFromExport(exportResult);
        
        if (Math.abs(exportTotal - uiGrandTotal) > 0.01) {
          discrepancies.push(
            `${exportResult.format} total (${exportTotal}) differs from UI total (${uiGrandTotal})`
          );
        }
      }

      const passed = discrepancies.length === 0;
      const timestamp = new Date().toISOString();

      tag(passed ? 'export_parity_passed' : 'export_parity_failed', {
        formats: exports.map(e => e.format),
        discrepancies
      });

      return {
        passed,
        discrepancies,
        timestamp
      };
    } catch (error) {
      tag('export_parity_check_failed', { error: error.message });
      throw error;
    }
  }

  private generatePDFContent(quote: QuoteResult, input: QuoteInput): string {
    // Mock PDF content (in reality this would use a PDF library)
    const lines = quote.lines.map(line => 
      `${line.category} | ${line.code} | ${line.qty} ${line.uom} @ $${line.rate} = $${line.amount}`
    ).join('\n');

    const comparison = quote.comparison 
      ? `\nComparison to ${input.competitor_baseline?.label}: $${quote.comparison.competitor_amount} vs $${quote.totals.grand_total} (${quote.comparison.delta_percent > 0 ? '+' : ''}${quote.comparison.delta_percent}%)`
      : '';

    return `QUOTE SUMMARY
Version: ${input.version_id}
Lane: ${input.lane.origin.country}${input.lane.origin.state ? ', ' + input.lane.origin.state : ''} → ${input.lane.dest.country}${input.lane.dest.state ? ', ' + input.lane.dest.state : ''}

LINE ITEMS:
${lines}

TOTALS:
Before Discounts: $${quote.totals.before_discounts}
Discounts: -$${quote.totals.discounts_total}
After Discounts: $${quote.totals.after_discounts}
Taxes: $${quote.totals.taxes}
GRAND TOTAL: $${quote.totals.grand_total}${comparison}`;
  }

  private generateCSVContent(quote: QuoteResult, input: QuoteInput): string {
    const headers = 'Category,Code,Quantity,UOM,Rate,Amount,Discountable';
    const lines = quote.lines.map(line => 
      `${line.category},${line.code},${line.qty},${line.uom},${line.rate},${line.amount},${line.discountable}`
    ).join('\n');

    const totalsSection = `
Totals Section,,,,,,
Before Discounts,,,,,${quote.totals.before_discounts},
Discounts,,,,,${quote.totals.discounts_total},
After Discounts,,,,,${quote.totals.after_discounts},
Taxes,,,,,${quote.totals.taxes},
Grand Total,,,,,${quote.totals.grand_total},`;

    const comparisonSection = quote.comparison 
      ? `
Comparison Section,,,,,,
Competitor (${input.competitor_baseline?.label}),,,,,${quote.comparison.competitor_amount},
Delta Amount,,,,,${quote.comparison.delta_amount},
Delta Percent,,,,,${quote.comparison.delta_percent},`
      : '';

    return `${headers}\n${lines}${totalsSection}${comparisonSection}`;
  }

  private generateXLSXContent(quote: QuoteResult, input: QuoteInput): string {
    // Mock XLSX content (in reality this would use a library like ExcelJS)
    const content = this.generateCSVContent(quote, input);
    return `[XLSX CONTENT]\n${content}`;
  }

  private async generateDigest(content: string): Promise<string> {
    // Simple hash for demo - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private extractTotalFromExport(exportResult: ExportResult): number {
    let content: string;
    
    if (exportResult.data instanceof Blob) {
      // For demo purposes, extract from mock content
      content = `Grand Total: $${Math.random() * 1000}`;
    } else {
      content = exportResult.data;
    }

    // Extract total from content
    const totalMatch = content.match(/Grand Total[^0-9]*([0-9.]+)/i);
    return totalMatch ? parseFloat(totalMatch[1]) : 0;
  }

  downloadFile(data: Blob | string, filename: string, format: string) {
    const blob = data instanceof Blob ? data : new Blob([data], { 
      type: format === 'CSV' ? 'text/csv' : 'application/octet-stream' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const quoteExportService = new QuoteExportService();