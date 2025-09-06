/**
 * C3PL V17.1.2 RMA Finance View
 * Finance interface for AR adjustments, credit memos, and disposal tracking
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { rmaService } from "@/lib/rma-service";
import { RBACGate } from "@/components/rbac-gate";
import { withErrorBoundary } from "@/components/error-boundary";
import { RMA, CreditMemo, GLJournalEntry, UserRole } from "@/lib/types";
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  TrendDown,
  TrendUp,
  Receipt,
  Calculator
} from "@phosphor-icons/react";

interface RMAFinanceViewProps {
  userRole: UserRole;
  onBack: () => void;
}

function RMAFinanceView({ userRole, onBack }: RMAFinanceViewProps) {
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [creditMemos, setCreditMemos] = useState<CreditMemo[]>([]);
  const [glJournals, setGlJournals] = useState<GLJournalEntry[]>([]);
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      const [rmaList, credits, journals] = await Promise.all([
        rmaService.getRMAs(userRole),
        rmaService.getCreditMemos(),
        rmaService.getGLJournals()
      ]);
      
      setRmas(rmaList);
      setCreditMemos(credits);
      setGlJournals(journals);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    }
  };

  const processedRMAs = rmas.filter(rma => 
    rma.lines.some(line => line.status === "posted")
  );

  const totalCredits = creditMemos.reduce((sum, cm) => sum + cm.totals.total, 0);
  const totalAdjustments = processedRMAs.reduce((sum, rma) => 
    sum + rma.lines.reduce((lineSum, line) => 
      lineSum + line.accounting_adjustments.reduce((adjSum, adj) => adjSum + adj.amount, 0), 0
    ), 0
  );

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
            <h2 className="text-2xl font-bold">RMA Finance View</h2>
            <p className="text-muted-foreground">AR adjustments, credit memos, and disposal tracking</p>
          </div>
        </div>
        <Badge variant="outline">V17.1.2</Badge>
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits Issued</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredits)}</p>
              </div>
              <TrendDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAdjustments)}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed RMAs</p>
                <p className="text-2xl font-bold">{processedRMAs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GL Entries</p>
                <p className="text-2xl font-bold">{glJournals.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processed RMAs */}
        <Card>
          <CardHeader>
            <CardTitle>Processed RMAs ({processedRMAs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {processedRMAs.map((rma) => (
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
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="text-xs">
                          {rma.lines.filter(l => l.status === "posted").length} processed
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rma.meta.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {processedRMAs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No processed RMAs found</p>
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
                    className="p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cm.credit_memo_number}</p>
                        <p className="text-sm text-muted-foreground">{cm.client_name}</p>
                        <p className="text-xs text-muted-foreground">RMA: {cm.rma_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{formatCurrency(cm.totals.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cm.issued_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {creditMemos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                <span className="text-muted-foreground">Client:</span>
                <p className="font-medium">{selectedRMA.client.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Original Invoice:</span>
                <p className="font-medium">{selectedRMA.references.original_invoice_id}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Accounting Adjustments</h4>
              {selectedRMA.lines.map((line) => (
                line.status === "posted" && line.accounting_adjustments.length > 0 && (
                  <div key={line.line_id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{line.sku}</span>
                      <Badge variant="outline">{line.disposition}</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {line.accounting_adjustments.map((adj, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {adj.type.replace(/_/g, ' ')}
                          </span>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(adj.amount)}</span>
                            {adj.gl_journal_id && (
                              <p className="text-xs text-muted-foreground">GL: {adj.gl_journal_id}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withErrorBoundary(
  function GuardedRMAFinanceView(props: RMAFinanceViewProps) {
    return (
      <RBACGate userRole={props.userRole} permission="rma:finance_view" actor="rma-finance">
        <RMAFinanceView {...props} />
      </RBACGate>
    );
  },
  { actor: "rma-finance", module: "rma" }
);