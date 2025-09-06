/**
 * C3PL V17.1.3 Export Parity Debugger Tool
 * Compare UI totals to export totals with digest verification
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, Play, FileText } from '@phosphor-icons/react';
import { checkExportParity, type ExportFormat, type ExportTotals, type ExportParityResult } from '@/lib/export-parity';
import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.1.3', 'export-parity-debugger');

interface ExportParityDebuggerProps {
  className?: string;
}

export function ExportParityDebugger({ className }: ExportParityDebuggerProps) {
  const [invoiceId, setInvoiceId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<{ [format in ExportFormat]?: ExportParityResult }>({});

  const mockUITotals: ExportTotals = {
    subtotal: 1000.00,
    discountAmount: 50.00,
    afterDiscounts: 950.00,
    taxAmount: 76.00,
    grandTotal: 1026.00,
    lineCount: 3
  };

  const checkParity = async (format: ExportFormat) => {
    if (!invoiceId.trim()) {
      alert('Please enter an invoice ID');
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkExportParity(invoiceId, format, mockUITotals);
      setResults(prev => ({ ...prev, [format]: result }));

      tag('parity_check_completed', {
        invoiceId,
        format,
        matches: result.matches,
        discrepancyCount: result.discrepancies?.length || 0
      });

    } catch (error) {
      tag('parity_check_failed', {
        invoiceId,
        format,
        error: error instanceof Error ? error.message : String(error)
      });
      alert(`Failed to check parity: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  const checkAllFormats = async () => {
    if (!invoiceId.trim()) {
      alert('Please enter an invoice ID');
      return;
    }

    const formats: ExportFormat[] = ['pdf', 'csv', 'xlsx'];
    
    for (const format of formats) {
      await checkParity(format);
      // Small delay between checks to simulate real processing
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const getParityBadge = (result: ExportParityResult) => {
    if (result.matches) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">PASS</Badge>;
    } else {
      return <Badge variant="destructive">FAIL</Badge>;
    }
  };

  const getDiscrepancyIcon = (hasDiscrepancy: boolean) => {
    return hasDiscrepancy ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-600" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Parity Tool
          <Badge variant="outline" className="text-xs">V17.1.3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Invoice ID (e.g., INV-001)"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={checkAllFormats} 
            disabled={isChecking || !invoiceId.trim()}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Check All
          </Button>
        </div>

        {/* Format Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => checkParity('pdf')}
            disabled={isChecking || !invoiceId.trim()}
          >
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => checkParity('csv')}
            disabled={isChecking || !invoiceId.trim()}
          >
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => checkParity('xlsx')}
            disabled={isChecking || !invoiceId.trim()}
          >
            XLSX
          </Button>
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Parity Check Results</h4>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              {(['pdf', 'csv', 'xlsx'] as ExportFormat[]).map(format => {
                const result = results[format];
                if (!result) return null;
                
                return (
                  <div key={format} className="text-center p-3 border rounded-lg">
                    <div className="font-medium text-sm uppercase mb-1">{format}</div>
                    {getParityBadge(result)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.discrepancies?.length || 0} discrepancies
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UI Totals Reference */}
            <div>
              <h5 className="font-medium text-sm mb-2">UI Totals (Reference)</h5>
              <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(mockUITotals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{formatCurrency(mockUITotals.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>After Discounts:</span>
                  <span>{formatCurrency(mockUITotals.afterDiscounts)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(mockUITotals.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(mockUITotals.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Line Count:</span>
                  <span>{mockUITotals.lineCount}</span>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            {Object.entries(results).map(([format, result]) => {
              if (!result || result.matches) return null;
              
              return (
                <div key={format}>
                  <h5 className="font-medium text-sm mb-2 text-destructive">
                    {format.toUpperCase()} Discrepancies
                  </h5>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead className="text-right">UI Value</TableHead>
                        <TableHead className="text-right">Export Value</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.discrepancies?.map((disc, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{disc.field}</TableCell>
                          <TableCell className="text-right font-mono">
                            {typeof disc.uiValue === 'number' 
                              ? formatCurrency(disc.uiValue) 
                              : disc.uiValue}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {typeof disc.exportValue === 'number' 
                              ? formatCurrency(disc.exportValue) 
                              : disc.exportValue}
                          </TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            {typeof disc.difference === 'number' 
                              ? formatCurrency(disc.difference) 
                              : disc.difference}
                          </TableCell>
                          <TableCell>
                            {getDiscrepancyIcon(true)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {/* Digest Information */}
            <div>
              <h5 className="font-medium text-sm mb-2">Export Digests</h5>
              <div className="space-y-2">
                {Object.entries(results).map(([format, result]) => (
                  <div key={format} className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded">
                    <span className="font-medium uppercase">{format}:</span>
                    <span className="font-mono text-xs">
                      {result.digest.substring(0, 16)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isChecking && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 animate-spin" />
              Checking export parity...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}