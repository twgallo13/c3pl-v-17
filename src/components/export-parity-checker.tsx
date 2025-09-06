/**
 * Export Parity Check Tool for C3PL V17.1.0
 * Compares totals across PDF, Excel, and CSV export formats
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle, FileCheck } from "@phosphor-icons/react";
import { ExportParityResult, Invoice } from "@/lib/types";
import { invoiceService } from "@/lib/invoice-service";
import { logEvent } from "@/lib/build-log";
import { useKV } from "@github/spark/hooks";

export function ExportParityChecker() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [parityResults, setParityResults] = useKV<ExportParityResult[]>("c3pl-parity-results", []);
  const [currentResults, setCurrentResults] = useState<ExportParityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);

  // Load available invoices
  const loadInvoices = async () => {
    try {
      const invoices = await invoiceService.getInvoices("Admin"); // Admin can see all invoices
      setAvailableInvoices(invoices);
    } catch (error) {
      logEvent("error", "Export Parity Checker", "system", `Failed to load invoices: ${error}`);
    }
  };

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const runParityCheck = async () => {
    if (!selectedInvoiceId) {
      logEvent("warn", "Export Parity Checker", "system", "No invoice selected for parity check");
      return;
    }

    try {
      setLoading(true);
      const results = await invoiceService.validateExportParity(selectedInvoiceId, "system");
      
      setCurrentResults(results);
      setParityResults(current => [
        ...results.map(r => ({ ...r })),
        ...current.slice(0, 47) // Keep last 50 results (3 formats * ~16 checks)
      ]);

      const allMatch = results.every(r => r.totalsMatch);
      const message = allMatch 
        ? `Export parity check passed for invoice ${selectedInvoiceId}`
        : `Export parity discrepancies found for invoice ${selectedInvoiceId}`;
      
      logEvent(allMatch ? "info" : "warn", "Export Parity Checker", "system", message);
    } catch (error) {
      logEvent("error", "Export Parity Checker", "system", `Failed to run parity check: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setParityResults([]);
    setCurrentResults([]);
    logEvent("info", "Export Parity Checker", "system", "Parity check results cleared");
  };

  const getResultIcon = (result: ExportParityResult) => {
    if (result.totalsMatch) {
      return <CheckCircle className="text-green-600" size={16} />;
    } else {
      return <XCircle className="text-red-600" size={16} />;
    }
  };

  const getResultBadge = (result: ExportParityResult) => {
    return (
      <Badge variant={result.totalsMatch ? "default" : "destructive"}>
        {result.totalsMatch ? "Match" : "Mismatch"}
      </Badge>
    );
  };

  const selectedInvoice = availableInvoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck size={20} />
          Export Parity Check Tool
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare totals across PDF, Excel, and CSV export formats
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invoice Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Invoice</label>
          <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an invoice to check..." />
            </SelectTrigger>
            <SelectContent>
              {availableInvoices.map(invoice => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.clientName} (${invoice.totals.grandTotal.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Invoice Info */}
        {selectedInvoice && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Invoice:</span>
                <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                
                <span className="font-medium">Client:</span>
                <span>{selectedInvoice.clientName}</span>
                
                <span className="font-medium">Status:</span>
                <Badge variant="secondary">{selectedInvoice.status}</Badge>
                
                <span className="font-medium">Grand Total:</span>
                <span className="font-mono">${selectedInvoice.totals.grandTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={runParityCheck} 
            disabled={!selectedInvoiceId || loading}
            className="flex-1"
          >
            {loading ? "Running Check..." : "Run Parity Check"}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>

        {/* Current Results */}
        {currentResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Latest Parity Check Results</span>
                <div className="flex items-center gap-2">
                  {currentResults.every(r => r.totalsMatch) ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertTriangle className="text-orange-600" size={20} />
                  )}
                  <Badge variant={currentResults.every(r => r.totalsMatch) ? "default" : "destructive"}>
                    {currentResults.every(r => r.totalsMatch) ? "All Match" : "Discrepancies Found"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discrepancies</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.format}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResultIcon(result)}
                          {getResultBadge(result)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.discrepancies.length > 0 ? (
                          <div className="space-y-1">
                            {result.discrepancies.map((discrepancy, idx) => (
                              <div key={idx} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                                {discrepancy}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Historical Results */}
        {parityResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parity Check History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parityResults
                  .slice(0, 15) // Show last 15 results
                  .map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {getResultIcon(result)}
                        <span className="text-sm font-medium">{result.format}</span>
                        {getResultBadge(result)}
                        {result.discrepancies.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {result.discrepancies.length} issues
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.actor}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Formats Summary */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4">
            <h4 className="font-medium text-blue-900 mb-2">Export Parity Validation</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>PDF:</strong> Formatted document with invoice layout</div>
              <div>• <strong>Excel:</strong> Spreadsheet with formulas and calculations</div>
              <div>• <strong>CSV:</strong> Raw data for system integration</div>
              <div className="pt-2 text-blue-600">
                All formats must have matching totals for parity validation to pass.
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}