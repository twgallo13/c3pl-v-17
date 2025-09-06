import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, Package, Printer, AlertTriangle, CheckCircle } from "@phosphor-icons/react";
import { PurchaseOrder, Bin, InventoryItem, WMSAuditEvent, UserRole } from "@/lib/types";
import { WMSService } from "@/lib/wms-service";
import { useKV } from "@github/spark/hooks";
import { toast } from "sonner";

interface ReceivingScreenProps {
  userRole: UserRole;
  onBack: () => void;
}

export function ReceivingScreen({ userRole, onBack }: ReceivingScreenProps) {
  const [purchaseOrders] = useKV<PurchaseOrder[]>("wms-purchase-orders", WMSService.generateSamplePOs());
  const [bins] = useKV<Bin[]>("wms-bins", WMSService.generateSampleBins());
  const [inventory, setInventory] = useKV<InventoryItem[]>("wms-inventory", []);
  const [auditEvents, setAuditEvents] = useKV<WMSAuditEvent[]>("wms-audit-events", []);
  
  const [scannedPO, setScannedPO] = useState<string>("");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [scannedSKU, setScannedSKU] = useState<string>("");
  const [receivingQuantity, setReceivingQuantity] = useState<number>(0);
  const [selectedBin, setSelectedBin] = useState<string>("");
  const [trackingId, setTrackingId] = useState<string>("");

  // Handle PO scan
  const handlePOScan = () => {
    const po = purchaseOrders.find(p => p.poNumber === scannedPO);
    if (po) {
      setSelectedPO(po);
      setTrackingId(`TRK-${Date.now()}`);
      
      // Log PO scan event
      const auditEvent = WMSService.logAuditEvent({
        event: "po_scanned",
        entityId: po.id,
        entityType: "PO",
        actor: `${userRole}-user`,
        metadata: { poNumber: po.poNumber, vendorName: po.vendorName }
      });
      
      setAuditEvents(current => [...current, auditEvent]);
      toast.success(`PO ${po.poNumber} scanned successfully`);
    } else {
      toast.error("PO not found");
    }
  };

  // Handle item receiving
  const handleReceiveItem = () => {
    if (!selectedPO || !scannedSKU || !selectedBin || receivingQuantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const poLine = selectedPO.lines.find(line => line.sku === scannedSKU);
    if (!poLine) {
      toast.error("SKU not found in this PO");
      return;
    }

    const selectedBinData = bins.find(b => b.id === selectedBin);
    if (!selectedBinData) {
      toast.error("Invalid bin selection");
      return;
    }

    // Check bin capacity
    const newCount = selectedBinData.currentCount + receivingQuantity;
    const isOverCapacity = newCount > selectedBinData.capacity;

    if (isOverCapacity) {
      toast.error(`Warning: Bin ${selectedBinData.location} will exceed capacity (${newCount}/${selectedBinData.capacity})`);
    }

    // Simulate receiving
    const { inventoryItem, auditEvent } = WMSService.simulateReceiving(
      selectedPO.id,
      scannedSKU,
      receivingQuantity,
      selectedBin,
      `${userRole}-user`
    );

    // Update inventory
    setInventory(current => [...current, inventoryItem]);
    setAuditEvents(current => [...current, auditEvent]);

    // Generate label data
    const labelData = {
      sku: scannedSKU,
      variant: poLine.variant || "",
      trackingId: inventoryItem.trackingId,
      binLocation: selectedBinData.location,
      quantity: receivingQuantity,
      receivedDate: new Date().toLocaleDateString()
    };

    toast.success(`Received ${receivingQuantity} units of ${scannedSKU}`);
    
    // Reset form
    setScannedSKU("");
    setReceivingQuantity(0);
    setSelectedBin("");
  };

  // Print label simulation
  const handlePrintLabel = () => {
    if (!scannedSKU || !trackingId) {
      toast.error("No item to print label for");
      return;
    }
    
    toast.success("Label printed successfully");
  };

  const getAvailableBins = () => {
    return bins.filter(bin => bin.status === "Available" || bin.status === "Full");
  };

  const getBinCapacityWarning = (binId: string) => {
    const bin = bins.find(b => b.id === binId);
    if (!bin) return null;
    
    const utilizationPercent = (bin.currentCount / bin.capacity) * 100;
    if (utilizationPercent >= 90) {
      return "warning";
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receiving Station</h1>
          <p className="text-muted-foreground">Scan PO and receive inventory items</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PO Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Purchase Order Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Scan PO number..."
                value={scannedPO}
                onChange={(e) => setScannedPO(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePOScan()}
              />
              <Button onClick={handlePOScan}>
                <Scan className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>

            {selectedPO && (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    PO {selectedPO.poNumber} from {selectedPO.vendorName} loaded successfully
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expected SKUs:</Label>
                  <div className="space-y-2">
                    {selectedPO.lines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{line.sku}</span>
                          {line.variant && <span className="text-sm text-muted-foreground ml-2">({line.variant})</span>}
                          <p className="text-sm text-muted-foreground">{line.description}</p>
                        </div>
                        <Badge variant="outline">
                          {line.receivedQuantity}/{line.expectedQuantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Receiving */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Receiving
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPO ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please scan a PO first to begin receiving
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sku-scan">SKU</Label>
                  <Input
                    id="sku-scan"
                    placeholder="Scan SKU..."
                    value={scannedSKU}
                    onChange={(e) => setScannedSKU(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={receivingQuantity || ""}
                    onChange={(e) => setReceivingQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="bin-assignment">Bin Assignment</Label>
                  <Select value={selectedBin} onValueChange={setSelectedBin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBins().map((bin) => (
                        <SelectItem key={bin.id} value={bin.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{bin.location} (Zone {bin.zone})</span>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-sm text-muted-foreground">
                                {bin.currentCount}/{bin.capacity}
                              </span>
                              {getBinCapacityWarning(bin.id) && (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBin && getBinCapacityWarning(selectedBin) && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Warning: This bin is near or at capacity
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Label htmlFor="tracking-id">Tracking ID</Label>
                  <Input
                    id="tracking-id"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Auto-generated..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleReceiveItem} className="flex-1">
                    Receive Item
                  </Button>
                  <Button variant="outline" onClick={handlePrintLabel}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Session Summary */}
      {selectedPO && (
        <Card>
          <CardHeader>
            <CardTitle>Receiving Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {inventory.filter(i => i.trackingId?.includes(trackingId.slice(0, 8))).length}
                </div>
                <div className="text-sm text-muted-foreground">Items Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedPO.lines.length}
                </div>
                <div className="text-sm text-muted-foreground">Expected SKUs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {auditEvents.filter(e => e.event === "po_scanned" || e.event === "item_received").length}
                </div>
                <div className="text-sm text-muted-foreground">Audit Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}