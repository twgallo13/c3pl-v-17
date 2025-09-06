import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  Scan, 
  Scale, 
  Ruler, 
  CheckCircle, 
  Truck, 
  AlertTriangle,
  Plus,
  X
} from "@phosphor-icons/react";
import { Order, PackoutCarton, WMSAuditEvent, UserRole } from "@/lib/types";
import { WMSService } from "@/lib/wms-service";
import { useKV } from "@github/spark/hooks";
import { toast } from "sonner";

interface PackoutStationProps {
  userRole: UserRole;
  onBack: () => void;
}

interface ScannedItem {
  sku: string;
  variant?: string;
  quantity: number;
  trackingId?: string;
}

export function PackoutStation({ userRole, onBack }: PackoutStationProps) {
  const [orders, setOrders] = useKV<Order[]>("wms-orders", WMSService.generateSampleOrders());
  const [cartons, setCartons] = useKV<PackoutCarton[]>("wms-cartons", []);
  const [auditEvents, setAuditEvents] = useKV<WMSAuditEvent[]>("wms-audit-events", []);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [scannedOrderNumber, setScannedOrderNumber] = useState<string>("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentScan, setCurrentScan] = useState<string>("");
  const [cartonNumber, setCartonNumber] = useState<string>("");
  const [weight, setWeight] = useState<number>(0);
  const [dimensions, setDimensions] = useState({
    length: 0,
    width: 0,
    height: 0
  });

  // Get picked orders ready for packing
  const getPackingOrders = () => {
    return orders.filter(order => 
      order.status === "Picking" && 
      order.lines.every(line => line.pickStatus === "Picked")
    );
  };

  // Handle order scan
  const handleOrderScan = () => {
    const order = orders.find(o => o.orderNumber === scannedOrderNumber);
    if (!order) {
      toast.error("Order not found");
      return;
    }

    if (order.status !== "Picking") {
      toast.error("Order is not ready for packing");
      return;
    }

    const allPicked = order.lines.every(line => line.pickStatus === "Picked");
    if (!allPicked) {
      toast.error("Not all items have been picked for this order");
      return;
    }

    setSelectedOrder(order);
    setCartonNumber(`CART-${Date.now()}`);
    setScannedItems([]);
    toast.success(`Order ${order.orderNumber} loaded for packing`);
  };

  // Handle item scan
  const handleItemScan = () => {
    if (!selectedOrder || !currentScan) {
      toast.error("Please scan an order first and enter an item");
      return;
    }

    // Find the item in the order
    const orderLine = selectedOrder.lines.find(line => 
      line.sku === currentScan || 
      (line.variant && `${line.sku}-${line.variant}` === currentScan)
    );

    if (!orderLine) {
      toast.error("Item not found in this order");
      return;
    }

    // Check if already scanned
    const existingItem = scannedItems.find(item => 
      item.sku === orderLine.sku && item.variant === orderLine.variant
    );

    if (existingItem) {
      // Increase quantity
      setScannedItems(prev => 
        prev.map(item => 
          item.sku === orderLine.sku && item.variant === orderLine.variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: ScannedItem = {
        sku: orderLine.sku,
        variant: orderLine.variant,
        quantity: 1,
        trackingId: `TRK-${Date.now()}`
      };
      setScannedItems(prev => [...prev, newItem]);
    }

    setCurrentScan("");
    toast.success(`Scanned ${orderLine.sku}`);
  };

  // Remove scanned item
  const handleRemoveItem = (sku: string, variant?: string) => {
    setScannedItems(prev => 
      prev.filter(item => !(item.sku === sku && item.variant === variant))
    );
  };

  // Validate packing completion
  const validatePacking = () => {
    if (!selectedOrder) return false;

    for (const orderLine of selectedOrder.lines) {
      const scannedItem = scannedItems.find(item => 
        item.sku === orderLine.sku && item.variant === orderLine.variant
      );
      
      if (!scannedItem || scannedItem.quantity < orderLine.quantity) {
        return false;
      }
    }

    return true;
  };

  // Complete packing
  const handleCompletePacking = () => {
    if (!selectedOrder || !validatePacking()) {
      toast.error("Please scan all required items");
      return;
    }

    if (!weight || weight <= 0) {
      toast.error("Please enter package weight");
      return;
    }

    if (!dimensions.length || !dimensions.width || !dimensions.height) {
      toast.error("Please enter package dimensions");
      return;
    }

    // Create carton
    const { carton, auditEvent } = WMSService.simulatePackout(
      selectedOrder.id,
      cartonNumber,
      weight,
      dimensions,
      `${userRole}-user`
    );

    // Add scanned items to carton
    carton.items = scannedItems.map(item => ({
      sku: item.sku,
      variant: item.variant,
      quantity: item.quantity,
      trackingId: item.trackingId
    }));

    setCartons(current => [...current, carton]);
    setAuditEvents(current => [...current, auditEvent]);

    // Update order status
    setOrders(current => 
      current.map(order => 
        order.id === selectedOrder.id
          ? { 
              ...order, 
              status: "Packed", 
              packedAt: new Date().toISOString(),
              trackingNumber: carton.trackingNumber
            }
          : order
      )
    );

    toast.success(`Order ${selectedOrder.orderNumber} packed successfully!`);

    // Reset form
    setSelectedOrder(null);
    setScannedOrderNumber("");
    setScannedItems([]);
    setWeight(0);
    setDimensions({ length: 0, width: 0, height: 0 });
    setCartonNumber("");
  };

  // Get missing items
  const getMissingItems = () => {
    if (!selectedOrder) return [];

    return selectedOrder.lines.filter(orderLine => {
      const scannedItem = scannedItems.find(item => 
        item.sku === orderLine.sku && item.variant === orderLine.variant
      );
      return !scannedItem || scannedItem.quantity < orderLine.quantity;
    });
  };

  // Get extra items
  const getExtraItems = () => {
    if (!selectedOrder) return [];

    return scannedItems.filter(scannedItem => {
      const orderLine = selectedOrder.lines.find(line => 
        line.sku === scannedItem.sku && line.variant === scannedItem.variant
      );
      return !orderLine || scannedItem.quantity > orderLine.quantity;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packout Station</h1>
          <p className="text-muted-foreground">Scan picked items and create shipping cartons</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Order Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Scan order number..."
                value={scannedOrderNumber}
                onChange={(e) => setScannedOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOrderScan()}
              />
              <Button onClick={handleOrderScan}>
                <Scan className="h-4 w-4 mr-2" />
                Load
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Orders Ready for Packing:</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {getPackingOrders().map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                    onClick={() => setScannedOrderNumber(order.orderNumber)}
                  >
                    <div>
                      <span className="font-medium">{order.orderNumber}</span>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <Badge variant="outline">{order.lines.length} items</Badge>
                  </div>
                ))}
                {getPackingOrders().length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No orders ready for packing
                  </p>
                )}
              </div>
            </div>

            {selectedOrder && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Order {selectedOrder.orderNumber} loaded • {selectedOrder.lines.length} items expected
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Item Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedOrder ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please scan an order first to begin packing
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan item SKU..."
                    value={currentScan}
                    onChange={(e) => setCurrentScan(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleItemScan()}
                  />
                  <Button onClick={handleItemScan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium">Scanned Items:</Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {scannedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                        <div>
                          <span className="font-medium">{item.sku}</span>
                          {item.variant && <span className="text-sm text-muted-foreground ml-2">({item.variant})</span>}
                          <span className="ml-2">× {item.quantity}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleRemoveItem(item.sku, item.variant)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {scannedItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No items scanned yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Missing Items */}
                {getMissingItems().length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-red-600">Missing Items:</Label>
                    <div className="space-y-1">
                      {getMissingItems().map((line, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                          <span className="font-medium">{line.sku}</span>
                          {line.variant && <span className="text-sm text-muted-foreground ml-2">({line.variant})</span>}
                          <span className="ml-2">× {line.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Items */}
                {getExtraItems().length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-amber-600">Extra Items:</Label>
                    <div className="space-y-1">
                      {getExtraItems().map((item, index) => (
                        <div key={index} className="p-2 bg-amber-50 border border-amber-200 rounded">
                          <span className="font-medium">{item.sku}</span>
                          {item.variant && <span className="text-sm text-muted-foreground ml-2">({item.variant})</span>}
                          <span className="ml-2">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Package Details */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Package Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="carton-number">Carton Number</Label>
                  <Input
                    id="carton-number"
                    value={cartonNumber}
                    onChange={(e) => setCartonNumber(e.target.value)}
                    placeholder="Auto-generated..."
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={weight || ""}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Dimensions (inches)
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      value={dimensions.length || ""}
                      onChange={(e) => setDimensions(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                      placeholder="L"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={dimensions.width || ""}
                      onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                      placeholder="W"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={dimensions.height || ""}
                      onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                      placeholder="H"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCompletePacking} 
                  className="w-full"
                  disabled={!validatePacking() || !weight || !dimensions.length || !dimensions.width || !dimensions.height}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Complete Packing
                </Button>
              </div>
            </div>

            {validatePacking() && weight && dimensions.length && dimensions.width && dimensions.height && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to complete packing! Carton will be marked as shipped with tracking number.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Cartons */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Packed Cartons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cartons.slice(-5).reverse().map((carton) => (
              <div key={carton.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{carton.cartonNumber}</span>
                  <p className="text-sm text-muted-foreground">
                    {carton.items.length} items • {carton.weight} lbs • 
                    {carton.dimensions.length}"×{carton.dimensions.width}"×{carton.dimensions.height}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Packed: {new Date(carton.packedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{carton.trackingNumber}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order: {carton.orderId}
                  </p>
                </div>
              </div>
            ))}
            {cartons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cartons packed yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}