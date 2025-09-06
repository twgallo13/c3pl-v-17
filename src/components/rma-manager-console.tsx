/**
 * C3PL V17.1.2 RMA Manager Console
 * Manager interface for disposition assignment and bulk approval
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useKV } from "@github/spark/hooks";
import { rmaService } from "@/lib/rma-service";
import { withRBACGuard } from "@/lib/rbac";
import { withErrorBoundary } from "@/components/error-boundary";
import { RMA, RMALine, DispositionType, UserRole } from "@/lib/types";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ClipboardList, 
  CheckSquare, 
  DollarSign,
  Package,
  Trash,
  Wrench,
  RotateCcw,
  Eye,
  Users
} from "@phosphor-icons/react";

interface RMAManagerConsoleProps {
  userRole: UserRole;
  onBack: () => void;
}

interface DispositionAssignment {
  lineId: string;
  disposition: DispositionType;
  notes: string;
}

function RMAManagerConsole({ userRole, onBack }: RMAManagerConsoleProps) {
  const [rmas, setRmas] = useKV<RMA[]>("manager-rmas", []);
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [dispositionAssignments, setDispositionAssignments] = useState<Record<string, DispositionAssignment>>({});
  const [bulkDisposition, setBulkDisposition] = useState<DispositionType>("RESTOCK");
  const [bulkNotes, setBulkNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRMAs();
  }, []);

  const loadRMAs = async () => {
    try {
      const rmaList = await rmaService.getRMAs(userRole);
      setRmas(rmaList);
    } catch (error) {
      toast.error(`Failed to load RMAs: ${error}`);
    }
  };

  const handleSelectRMA = async (rmaId: string) => {
    try {
      const rma = await rmaService.getRMAById(rmaId, userRole);
      setSelectedRMA(rma);
      setSelectedLines([]);
      setDispositionAssignments({});
    } catch (error) {
      toast.error(`Failed to load RMA details: ${error}`);
    }
  };

  const handleLineSelection = (lineId: string, selected: boolean) => {
    if (selected) {
      setSelectedLines(prev => [...prev, lineId]);
    } else {
      setSelectedLines(prev => prev.filter(id => id !== lineId));
      setDispositionAssignments(prev => {
        const updated = { ...prev };
        delete updated[lineId];
        return updated;
      });
    }
  };

  const handleDispositionChange = (lineId: string, disposition: DispositionType) => {
    setDispositionAssignments(prev => ({
      ...prev,
      [lineId]: {
        lineId,
        disposition,
        notes: prev[lineId]?.notes || ""
      }
    }));
  };

  const handleNotesChange = (lineId: string, notes: string) => {
    setDispositionAssignments(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        lineId,
        disposition: prev[lineId]?.disposition || "RESTOCK",
        notes
      }
    }));
  };

  const handleBulkAssign = () => {
    const assignments: Record<string, DispositionAssignment> = {};
    selectedLines.forEach(lineId => {
      assignments[lineId] = {
        lineId,
        disposition: bulkDisposition,
        notes: bulkNotes
      };
    });
    setDispositionAssignments(prev => ({ ...prev, ...assignments }));
    toast.success(`Bulk assigned ${selectedLines.length} items to ${bulkDisposition}`);
  };

  const handleProcessSelected = async () => {
    if (!selectedRMA || selectedLines.length === 0) {
      toast.error("No items selected for processing");
      return;
    }

    const unassignedLines = selectedLines.filter(lineId => !dispositionAssignments[lineId]);
    if (unassignedLines.length > 0) {
      toast.error("Please assign dispositions to all selected items");
      return;
    }

    setIsProcessing(true);
    try {
      const results = [];
      
      for (const lineId of selectedLines) {
        const assignment = dispositionAssignments[lineId];
        const result = await rmaService.processDisposition(
          selectedRMA.rma_id,
          lineId,
          assignment.disposition,
          assignment.notes,
          `manager-${userRole}`,
          userRole
        );
        results.push({ lineId, ...result });
      }

      // Refresh RMA data
      const updatedRMA = await rmaService.getRMAById(selectedRMA.rma_id, userRole);
      setSelectedRMA(updatedRMA);
      setSelectedLines([]);
      setDispositionAssignments({});
      
      // Refresh RMA list
      await loadRMAs();
      
      toast.success(`Processed ${results.length} items successfully`);
    } catch (error) {
      toast.error(`Failed to process items: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDispositionIcon = (disposition: DispositionType) => {
    switch (disposition) {
      case "RESTOCK": return <RotateCcw className="h-4 w-4" />;
      case "SCRAP": return <Trash className="h-4 w-4" />;
      case "RTV": return <Package className="h-4 w-4" />;
      case "REPAIR": return <Wrench className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getDispositionColor = (disposition: DispositionType) => {
    switch (disposition) {
      case "RESTOCK": return "text-green-600";
      case "SCRAP": return "text-red-600";
      case "RTV": return "text-blue-600";
      case "REPAIR": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const openRMAs = rmas.filter(rma => rma.meta.status === "open");
  const totalItems = openRMAs.reduce((sum, rma) => sum + rma.lines.length, 0);
  const pendingItems = openRMAs.reduce((sum, rma) => 
    sum + rma.lines.filter(line => line.status === "pending").length, 0
  );

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
            <h2 className="text-2xl font-bold">RMA Manager Console</h2>
            <p className="text-muted-foreground">Review and process return dispositions</p>
          </div>
        </div>
        <Badge variant="outline">V17.1.2</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open RMAs</p>
                <p className="text-2xl font-bold">{openRMAs.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Disposition</p>
                <p className="text-2xl font-bold">{pendingItems}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {totalItems > 0 ? Math.round(((totalItems - pendingItems) / totalItems) * 100) : 0}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RMA List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Open RMAs ({openRMAs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openRMAs.map((rma) => (
                <div 
                  key={rma.rma_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRMA?.rma_id === rma.rma_id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectRMA(rma.rma_id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{rma.rma_id}</p>
                      <p className="text-sm text-muted-foreground">{rma.client.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {rma.lines.length} items
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rma.lines.filter(l => l.status === "pending").length} pending
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {openRMAs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No open RMAs found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RMA Details */}
        {selectedRMA && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedRMA.rma_id}</span>
                <Badge variant="outline">{selectedRMA.client.name}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Original Invoice:</span>
                  <p className="font-medium">{selectedRMA.references.original_invoice_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {new Date(selectedRMA.meta.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Bulk Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Bulk Actions</h4>
                <div className="flex gap-2">
                  <Select value={bulkDisposition} onValueChange={(value: DispositionType) => setBulkDisposition(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTOCK">Restock</SelectItem>
                      <SelectItem value="SCRAP">Scrap</SelectItem>
                      <SelectItem value="RTV">RTV</SelectItem>
                      <SelectItem value="REPAIR">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleBulkAssign}
                    disabled={selectedLines.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    Assign to Selected ({selectedLines.length})
                  </Button>
                </div>
                
                <Textarea
                  placeholder="Bulk notes (optional)"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Process Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleProcessSelected}
                  disabled={isProcessing || selectedLines.length === 0}
                  className="flex-1"
                >
                  {isProcessing ? "Processing..." : `Process Selected (${selectedLines.length})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RMA Line Items */}
      {selectedRMA && selectedRMA.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items ({selectedRMA.lines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedRMA.lines.map((line) => (
                <div key={line.line_id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={selectedLines.includes(line.line_id)}
                        onChange={(e) => handleLineSelection(line.line_id, e.target.checked)}
                        disabled={line.status === "posted"}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{line.sku}</span>
                            {line.variant && (
                              <Badge variant="outline" className="text-xs">{line.variant}</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {line.reason_code}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{line.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {line.qty} | Price: ${line.pricing.unit_price.toFixed(2)} | 
                            Cost: ${line.costing.unit_cost.toFixed(2)} | 
                            Total Value: ${(line.qty * line.pricing.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={
                          line.status === "pending" ? "secondary" :
                          line.status === "posted" ? "default" : "destructive"
                        }>
                          {line.status}
                        </Badge>
                      </div>

                      {line.status === "pending" && selectedLines.includes(line.line_id) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                          <div>
                            <Label className="text-xs">Disposition</Label>
                            <Select
                              value={dispositionAssignments[line.line_id]?.disposition || ""}
                              onValueChange={(value: DispositionType) => handleDispositionChange(line.line_id, value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select disposition" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RESTOCK">
                                  <div className="flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4 text-green-600" />
                                    Restock
                                  </div>
                                </SelectItem>
                                <SelectItem value="SCRAP">
                                  <div className="flex items-center gap-2">
                                    <Trash className="h-4 w-4 text-red-600" />
                                    Scrap
                                  </div>
                                </SelectItem>
                                <SelectItem value="RTV">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    Return to Vendor
                                  </div>
                                </SelectItem>
                                <SelectItem value="REPAIR">
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-yellow-600" />
                                    Repair
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Notes</Label>
                            <Textarea
                              placeholder="Disposition notes"
                              value={dispositionAssignments[line.line_id]?.notes || ""}
                              onChange={(e) => handleNotesChange(line.line_id, e.target.value)}
                              rows={1}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {line.status === "posted" && line.disposition && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDispositionIcon(line.disposition)}
                              <span className={`text-sm font-medium ${getDispositionColor(line.disposition)}`}>
                                {line.disposition}
                              </span>
                              {line.processed_by && (
                                <Badge variant="outline" className="text-xs">
                                  by {line.processed_by}
                                </Badge>
                              )}
                            </div>
                            {line.processed_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(line.processed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {line.disposition_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Notes: {line.disposition_notes}
                            </p>
                          )}
                          {line.accounting_adjustments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium">Generated Artifacts:</p>
                              {line.accounting_adjustments.map((adj, idx) => (
                                <div key={idx} className="text-xs text-muted-foreground">
                                  • {adj.type}: ${adj.amount.toFixed(2)}
                                  {adj.invoice_id && ` (${adj.invoice_id})`}
                                  {adj.gl_journal_id && ` [GL: ${adj.gl_journal_id}]`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
  withRBACGuard(RMAManagerConsole, "rma:disposition"),
  { actor: "rma-manager", module: "rma" }
);