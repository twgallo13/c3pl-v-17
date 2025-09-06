/**
 * C3PL V17.1.2 Disposition Simulator
 * Test disposition paths and preview generated artifacts and GL impact
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { rmaService } from "@/lib/rma-service";
import { RMALine, DispositionType, ReasonCode, DispositionSimulationResult } from "@/lib/types";
import { 
  TestTube, 
  Play, 
  RotateCcw, 
  Trash, 
  Package, 
  Wrench,
  DollarSign,
  TrendUp,
  TrendDown,
  FileText
} from "@phosphor-icons/react";

export function DispositionSimulator() {
  const [testLine, setTestLine] = useState<Partial<RMALine>>({
    sku: "TEST-WIDGET-001",
    variant: "RED",
    description: "Test Widget - Red Variant",
    qty: 2,
    reason_code: "DEFECT",
    pricing: { unit_price: 100 },
    costing: { unit_cost: 50 }
  });
  
  const [selectedDisposition, setSelectedDisposition] = useState<DispositionType>("RESTOCK");
  const [simulationResult, setSimulationResult] = useState<DispositionSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    if (!testLine.sku || !testLine.qty || !testLine.pricing?.unit_price || !testLine.costing?.unit_cost) {
      return;
    }

    setIsSimulating(true);
    try {
      const fullLine: RMALine = {
        line_id: `test-${Date.now()}`,
        sku: testLine.sku,
        variant: testLine.variant,
        description: testLine.description || "",
        qty: testLine.qty,
        reason_code: testLine.reason_code || "DEFECT",
        pricing: testLine.pricing,
        costing: testLine.costing,
        accounting_adjustments: [],
        status: "pending",
        messages: []
      };

      const result = await rmaService.simulateDisposition(
        fullLine,
        selectedDisposition,
        "simulator"
      );
      
      setSimulationResult(result);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getDispositionIcon = (disposition: DispositionType) => {
    switch (disposition) {
      case "RESTOCK": return <RotateCcw className="h-4 w-4 text-green-600" />;
      case "SCRAP": return <Trash className="h-4 w-4 text-red-600" />;
      case "RTV": return <Package className="h-4 w-4 text-blue-600" />;
      case "REPAIR": return <Wrench className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getDispositionDescription = (disposition: DispositionType) => {
    switch (disposition) {
      case "RESTOCK": return "Item is returned to sellable inventory with customer credit";
      case "SCRAP": return "Item is written off with optional disposal fee";
      case "RTV": return "Item is returned to vendor with handling charge";
      case "REPAIR": return "Item is repaired and returned to sellable inventory";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Disposition Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Line Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium">Test Line Item</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-sku">SKU</Label>
              <Input
                id="test-sku"
                value={testLine.sku || ""}
                onChange={(e) => setTestLine(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="TEST-WIDGET-001"
              />
            </div>
            
            <div>
              <Label htmlFor="test-variant">Variant</Label>
              <Input
                id="test-variant"
                value={testLine.variant || ""}
                onChange={(e) => setTestLine(prev => ({ ...prev, variant: e.target.value }))}
                placeholder="RED"
              />
            </div>
            
            <div>
              <Label htmlFor="test-qty">Quantity</Label>
              <Input
                id="test-qty"
                type="number"
                min="1"
                value={testLine.qty || 1}
                onChange={(e) => setTestLine(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="test-reason">Reason Code</Label>
              <Select
                value={testLine.reason_code || "DEFECT"}
                onValueChange={(value: ReasonCode) => setTestLine(prev => ({ ...prev, reason_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFECT">Defective</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="UNWANTED">Unwanted</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="test-price">Unit Price ($)</Label>
              <Input
                id="test-price"
                type="number"
                step="0.01"
                value={testLine.pricing?.unit_price || 0}
                onChange={(e) => setTestLine(prev => ({ 
                  ...prev, 
                  pricing: { unit_price: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="test-cost">Unit Cost ($)</Label>
              <Input
                id="test-cost"
                type="number"
                step="0.01"
                value={testLine.costing?.unit_cost || 0}
                onChange={(e) => setTestLine(prev => ({ 
                  ...prev, 
                  costing: { unit_cost: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="test-description">Description</Label>
            <Input
              id="test-description"
              value={testLine.description || ""}
              onChange={(e) => setTestLine(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Test Widget - Red Variant"
            />
          </div>
        </div>

        <Separator />

        {/* Disposition Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Test Disposition</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["RESTOCK", "SCRAP", "RTV", "REPAIR"] as DispositionType[]).map((disposition) => (
              <div
                key={disposition}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDisposition === disposition
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedDisposition(disposition)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getDispositionIcon(disposition)}
                  <span className="font-medium text-sm">{disposition}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getDispositionDescription(disposition)}
                </p>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSimulate}
            disabled={isSimulating || !testLine.sku || !testLine.qty}
            className="w-full flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isSimulating ? "Simulating..." : `Simulate ${selectedDisposition} Disposition`}
          </Button>
        </div>

        {/* Simulation Results */}
        {simulationResult && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Simulation Results</h4>
                <Badge variant={simulationResult.status === "success" ? "default" : "destructive"}>
                  {simulationResult.status}
                </Badge>
              </div>

              {/* Financial Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">AR Impact</p>
                        <p className={`text-lg font-bold ${
                          simulationResult.ar_impact.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(simulationResult.ar_impact.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {simulationResult.ar_impact.account}
                        </p>
                      </div>
                      {simulationResult.ar_impact.amount >= 0 ? (
                        <TrendUp className="h-8 w-8 text-green-600" />
                      ) : (
                        <TrendDown className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Inventory Qty</p>
                        <p className={`text-lg font-bold ${
                          simulationResult.inventory_impact.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {simulationResult.inventory_impact.quantity_change > 0 ? '+' : ''}
                          {simulationResult.inventory_impact.quantity_change}
                        </p>
                        <p className="text-xs text-muted-foreground">units</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Inventory Value</p>
                        <p className={`text-lg font-bold ${
                          simulationResult.inventory_impact.value_change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(simulationResult.inventory_impact.value_change)}
                        </p>
                        <p className="text-xs text-muted-foreground">change</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Messages */}
              {simulationResult.messages.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Impact Analysis</h5>
                  <div className="space-y-1">
                    {simulationResult.messages.map((message, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Artifacts Preview */}
              {Object.keys(simulationResult.generated_artifacts).length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Generated Artifacts (Preview)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(simulationResult.generated_artifacts).map(([type, artifact]) => 
                      artifact && (
                        <div key={type} className="p-3 bg-muted/30 rounded-lg">
                          <p className="font-medium text-sm capitalize">
                            {type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Would generate {type} with appropriate GL entries
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => setSimulationResult(null)}
                  variant="outline"
                  size="sm"
                >
                  Clear Results
                </Button>
                
                <Button 
                  onClick={handleSimulate}
                  variant="outline"
                  size="sm"
                  disabled={isSimulating}
                >
                  Re-run Simulation
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}