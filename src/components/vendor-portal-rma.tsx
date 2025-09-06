/**
 * C3PL V17.1.2 Vendor Portal RMA
 * Read-only vendor interface for RMA credits and refunds
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rmaService } from "@/lib/rma-service";
import { RBACGate } from "@/components/rbac-gate";
import { withErrorBoundary } from "@/components/error-boundary";
import { RMA, CreditMemo, UserRole } from "@/lib/types";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  RotateCcw,
  DollarSign,
  Calendar
} from "@phosphor-icons/react";

interface VendorPortalRMAProps {
  userRole: UserRole;
  vendorId?: string;
  onBack: () => void;
}

function VendorPortalRMA({ userRole, vendorId = "vendor-001", onBack }: VendorPortalRMAProps) {
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [creditMemos, setCreditMemos] = useState<CreditMemo[]>([]);
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null);

  useEffect(() => {
    loadVendorRMAData();
  }, [vendorId]);

  const loadVendorRMAData = async () => {
    try {
      // For vendors, only show RMAs related to their invoices
      const vendorRMAs = await rmaService.getRMAs(userRole, vendorId);
      const allCreditMemos = rmaService.getCreditMemos();
      
      // Filter credit memos to those related to vendor RMAs
      const vendorRMAIds = vendorRMAs.map(rma => rma.rma_id);
      const vendorCreditMemos = allCreditMemos.filter(cm => 
        vendorRMAIds.includes(cm.rma_id)
      );
      
      setRmas(vendorRMAs);
      setCreditMemos(vendorCreditMemos);
    } catch (error) {
      console.error("Failed to load vendor RMA data:", error);
    }
  };

  const totalCreditsIssued = creditMemos.reduce((sum, cm) => sum + cm.totals.total, 0);
  const processedRMAs = rmas.filter(rma => 
    rma.lines.some(line => line.status === "posted")
  );

  const handleExportCSV = () => {
    const csvData = creditMemos.map(cm => ({
      "Credit Memo": cm.credit_memo_number,
      "RMA ID": cm.rma_id,
      "Client": cm.client_name,
      "Amount": cm.totals.total,
      "Issued Date": new Date(cm.issued_date).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-${vendorId}-rma-credits.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    // Simulate XLSX export
    console.log("XLSX export would generate Excel file with vendor RMA data");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">RMA Credits & Refunds</h2>
            <p className="text-muted-foreground">View your return merchandise credits and refund history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">V17.1.2</Badge>
          <Badge variant="secondary">Vendor: {vendorId}</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits Received</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCreditsIssued)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RMAs Processed</p>
                <p className="text-2xl font-bold">{processedRMAs.length}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Memos</p>
                <p className="text-2xl font-bold">{creditMemos.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            
            <Button 
              onClick={handleExportXLSX}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RMA List */}
        <Card>
          <CardHeader>
            <CardTitle>Your RMAs ({rmas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {rmas.map((rma) => (
                  <div 
                    key={rma.rma_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRMA?.rma_id === rma.rma_id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRMA(rma)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rma.rma_id}</p>
                        <p className="text-sm text-muted-foreground">{rma.client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Invoice: {rma.references.original_invoice_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={rma.meta.status === "open" ? "secondary" : "default"}>
                          {rma.meta.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rma.lines.length} items
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {rmas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No RMAs found for your account</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Credit Memos */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Memos ({creditMemos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {creditMemos.map((cm) => (
                  <div 
                    key={cm.id}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">{cm.credit_memo_number}</p>
                        <p className="text-sm text-green-600">{cm.client_name}</p>
                        <p className="text-xs text-green-600">
                          RMA: {cm.rma_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">{formatCurrency(cm.totals.total)}</p>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(cm.issued_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {creditMemos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No credit memos issued</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected RMA Details */}
      {selectedRMA && (
        <Card>
          <CardHeader>
            <CardTitle>RMA Details: {selectedRMA.rma_id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={selectedRMA.meta.status === "open" ? "secondary" : "default"} className="ml-2">
                  {selectedRMA.meta.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(selectedRMA.meta.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Items</h4>
              {selectedRMA.lines.map((line) => (
                <div key={line.line_id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{line.sku}</p>
                      <p className="text-sm text-muted-foreground">{line.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {line.qty} | Reason: {line.reason_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        line.status === "pending" ? "secondary" :
                        line.status === "posted" ? "default" : "destructive"
                      }>
                        {line.status}
                      </Badge>
                      {line.disposition && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {line.disposition}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withErrorBoundary(
  function GuardedVendorPortalRMA(props: VendorPortalRMAProps) {
    return (
      <RBACGate userRole={props.userRole} permission="rma:vendor_portal" actor="vendor-portal-rma">
        <VendorPortalRMA {...props} />
      </RBACGate>
    );
  },
  { actor: "vendor-portal-rma", module: "rma" }
);