/**
 * C3PL V17.1.2 RMA Intake Screen
 * Associate interface for creating RMAs and adding return items
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useKV } from "@github/spark/hooks";
import { rmaService } from "@/lib/rma-service";
import { RBACGate } from "@/components/rbac-gate";
import { withErrorBoundary } from "@/components/error-boundary";
import { RMA, RMALine, ReasonCode, UserRole } from "@/lib/types";
import { toast } from "sonner";
import { 
  Package, 
  Scan, 
  Plus, 
  Printer, 
  ArrowLeft, 
  Check,
  AlertTriangle 
} from "@phosphor-icons/react";

interface RMAIntakeProps {
  userRole: UserRole;
  onBack: () => void;
}

interface NewRMALine {
  sku: string;
  variant?: string;
  description: string;
  qty: number;
  reasonCode: ReasonCode;
  unitPrice: number;
  unitCost: number;
}

function RMAIntakeScreen({ userRole, onBack }: RMAIntakeProps) {
  const [currentRMA, setCurrentRMA] = useKV<RMA | null>("current-rma", null);
  const [newLine, setNewLine] = useState<NewRMALine>({
    sku: "",
    variant: "",
    description: "",
    qty: 1,
    reasonCode: "DEFECT",
    unitPrice: 0,
    unitCost: 0
  });
  const [scanMode, setScanMode] = useState(false);
  const [isCreatingRMA, setIsCreatingRMA] = useState(false);
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    accountId: "",
    name: "",
    originalInvoiceId: ""
  });

  const handleCreateRMA = async () => {
    if (!clientInfo.accountId || !clientInfo.name || !clientInfo.originalInvoiceId) {
      toast.error("Please fill in all client information");
      return;
    }

    setIsCreatingRMA(true);
    try {
      const rmaId = await rmaService.createRMA(
        clientInfo.accountId,
        clientInfo.name,
        clientInfo.originalInvoiceId,
        `associate-${userRole}`,
        userRole
      );

      const newRMA = await rmaService.getRMAById(rmaId, userRole);
      if (newRMA) {
        setCurrentRMA(newRMA);
        toast.success(`RMA ${rmaId} created successfully`);
      }
    } catch (error) {
      toast.error(`Failed to create RMA: ${error}`);
    } finally {
      setIsCreatingRMA(false);
    }
  };

  const handleAddLine = async () => {
    if (!currentRMA) return;
    
    if (!newLine.sku || !newLine.description || newLine.qty <= 0) {
      toast.error("Please fill in all line item details");
      return;
    }

    setIsAddingLine(true);
    try {
      await rmaService.addRMALine(
        currentRMA.rma_id,
        newLine.sku,
        newLine.variant,
        newLine.description,
        newLine.qty,
        newLine.reasonCode,
        newLine.unitPrice,
        newLine.unitCost,
        `associate-${userRole}`,
        userRole
      );

      // Refresh RMA data
      const updatedRMA = await rmaService.getRMAById(currentRMA.rma_id, userRole);
      if (updatedRMA) {
        setCurrentRMA(updatedRMA);
        setNewLine({
          sku: "",
          variant: "",
          description: "",
          qty: 1,
          reasonCode: "DEFECT",
          unitPrice: 0,
          unitCost: 0
        });
        toast.success("Item added to RMA");
      }
    } catch (error) {
      toast.error(`Failed to add item: ${error}`);
    } finally {
      setIsAddingLine(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!currentRMA) return;
    
    try {
      // Simulate label printing
      toast.success(`Return label printed for RMA ${currentRMA.rma_id}`);
      
      // Update RMA to mark label as printed
      const updatedRMA = { ...currentRMA, return_label_printed: true };
      setCurrentRMA(updatedRMA);
    } catch (error) {
      toast.error("Failed to print return label");
    }
  };

  const handleScanSKU = (scannedSKU: string) => {
    // Simulate SKU lookup
    const mockSKUData = {
      description: `Product for ${scannedSKU}`,
      unitPrice: Math.floor(Math.random() * 200) + 50,
      unitCost: Math.floor(Math.random() * 100) + 25
    };

    setNewLine(prev => ({
      ...prev,
      sku: scannedSKU,
      description: mockSKUData.description,
      unitPrice: mockSKUData.unitPrice,
      unitCost: mockSKUData.unitCost
    }));
    
    setScanMode(false);
    toast.success(`SKU ${scannedSKU} scanned successfully`);
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
            <h2 className="text-2xl font-bold">RMA Intake</h2>
            <p className="text-muted-foreground">Create returns and add items for processing</p>
          </div>
        </div>
        <Badge variant="outline">V17.1.2</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New RMA */}
        {!currentRMA && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create New RMA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="account-id">Client Account ID</Label>
                  <Input
                    id="account-id"
                    value={clientInfo.accountId}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, accountId: e.target.value }))}
                    placeholder="client-001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Acme Corporation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="original-invoice">Original Invoice ID</Label>
                  <Input
                    id="original-invoice"
                    value={clientInfo.originalInvoiceId}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, originalInvoiceId: e.target.value }))}
                    placeholder="inv-001"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateRMA}
                disabled={isCreatingRMA}
                className="w-full"
              >
                {isCreatingRMA ? "Creating..." : "Create RMA"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current RMA Info */}
        {currentRMA && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  {currentRMA.rma_id}
                </span>
                <Badge variant={currentRMA.meta.status === "open" ? "default" : "secondary"}>
                  {currentRMA.meta.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{currentRMA.client.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Original Invoice:</span>
                  <p className="font-medium">{currentRMA.references.original_invoice_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items:</span>
                  <p className="font-medium">{currentRMA.lines.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Label Printed:</span>
                  <p className={`font-medium ${currentRMA.return_label_printed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {currentRMA.return_label_printed ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={handlePrintLabel}
                  disabled={currentRMA.return_label_printed}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  {currentRMA.return_label_printed ? 'Label Printed' : 'Print Return Label'}
                </Button>
                
                <Button 
                  onClick={() => setCurrentRMA(null)}
                  variant="ghost"
                  size="sm"
                >
                  New RMA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Line Items */}
        {currentRMA && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Return Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="SKU or scan barcode"
                  value={newLine.sku}
                  onChange={(e) => setNewLine(prev => ({ ...prev, sku: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScanMode(!scanMode)}
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>

              {scanMode && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">Scan mode active - click on a SKU to simulate scan:</p>
                  <div className="flex gap-2 flex-wrap">
                    {["WIDGET-001", "GADGET-002", "TOOL-003"].map(sku => (
                      <Button
                        key={sku}
                        variant="outline"
                        size="sm"
                        onClick={() => handleScanSKU(sku)}
                        className="text-xs"
                      >
                        {sku}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="variant">Variant</Label>
                  <Input
                    id="variant"
                    value={newLine.variant || ""}
                    onChange={(e) => setNewLine(prev => ({ ...prev, variant: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={newLine.qty}
                    onChange={(e) => setNewLine(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newLine.description}
                  onChange={(e) => setNewLine(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason Code</Label>
                <Select
                  value={newLine.reasonCode}
                  onValueChange={(value: ReasonCode) => setNewLine(prev => ({ ...prev, reasonCode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFECT">Defective</SelectItem>
                    <SelectItem value="DAMAGED">Damaged in Transit</SelectItem>
                    <SelectItem value="UNWANTED">Customer Changed Mind</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit-price">Unit Price ($)</Label>
                  <Input
                    id="unit-price"
                    type="number"
                    step="0.01"
                    value={newLine.unitPrice}
                    onChange={(e) => setNewLine(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                  <Input
                    id="unit-cost"
                    type="number"
                    step="0.01"
                    value={newLine.unitCost}
                    onChange={(e) => setNewLine(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddLine}
                disabled={isAddingLine || !newLine.sku || !newLine.description}
                className="w-full"
              >
                {isAddingLine ? "Adding..." : "Add Item to RMA"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current RMA Items */}
      {currentRMA && currentRMA.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RMA Items ({currentRMA.lines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentRMA.lines.map((line) => (
                <div key={line.line_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
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
                      Qty: {line.qty} | Price: ${line.pricing.unit_price.toFixed(2)} | Cost: ${line.costing.unit_cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      line.status === "pending" ? "secondary" :
                      line.status === "posted" ? "default" : "destructive"
                    }>
                      {line.status}
                    </Badge>
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
  function GuardedRMAIntakeScreen(props: RMAIntakeScreenProps) {
    return (
      <RBACGate userRole={props.userRole} permission="rma:create" actor="rma-intake">
        <RMAIntakeScreen {...props} />
      </RBACGate>
    );
  },
  { actor: "rma-intake", module: "rma" }
);