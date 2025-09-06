import { 
  PurchaseOrder, 
  Order, 
  Wave, 
  PickTask, 
  PackoutCarton, 
  Bin, 
  InventoryItem, 
  WarehouseException,
  WMSAuditEvent,
  WaveKPIs,
  OrderStatus,
  WaveStatus,
  PickStatus,
  BinStatus
} from './types';

export class WMSService {
  
  // Generate sample data for demo purposes
  static generateSamplePOs(): PurchaseOrder[] {
    return [
      {
        id: "po-001",
        poNumber: "PO-2024-001",
        vendorId: "vendor-001",
        vendorName: "ACME Supplies",
        status: "Open",
        lines: [
          {
            id: "pol-001",
            sku: "WIDGET-A",
            description: "Premium Widget A",
            expectedQuantity: 100,
            receivedQuantity: 0,
            unitPrice: 15.99
          },
          {
            id: "pol-002",
            sku: "GADGET-B",
            variant: "Blue",
            description: "Gadget B - Blue Variant",
            expectedQuantity: 50,
            receivedQuantity: 0,
            unitPrice: 29.99
          }
        ],
        expectedDate: "2024-01-15",
        createdAt: "2024-01-10T10:00:00Z",
        updatedAt: "2024-01-10T10:00:00Z"
      },
      {
        id: "po-002",
        poNumber: "PO-2024-002",
        vendorId: "vendor-002",
        vendorName: "Tech Solutions",
        status: "Receiving",
        lines: [
          {
            id: "pol-003",
            sku: "CABLE-USB",
            description: "USB-C Cable 6ft",
            expectedQuantity: 200,
            receivedQuantity: 150,
            unitPrice: 12.50
          }
        ],
        expectedDate: "2024-01-12",
        createdAt: "2024-01-08T09:00:00Z",
        updatedAt: "2024-01-12T14:30:00Z"
      }
    ];
  }

  static generateSampleBins(): Bin[] {
    return [
      {
        id: "bin-a1-01",
        location: "A1-01",
        zone: "A",
        capacity: 100,
        currentCount: 45,
        status: "Available",
        assignedSKUs: ["WIDGET-A"],
        lastUpdated: "2024-01-12T10:00:00Z"
      },
      {
        id: "bin-a1-02",
        location: "A1-02",
        zone: "A",
        capacity: 100,
        currentCount: 98,
        status: "Full",
        assignedSKUs: ["GADGET-B"],
        lastUpdated: "2024-01-12T11:30:00Z"
      },
      {
        id: "bin-b2-01",
        location: "B2-01",
        zone: "B",
        capacity: 150,
        currentCount: 75,
        status: "Available",
        assignedSKUs: ["CABLE-USB"],
        lastUpdated: "2024-01-12T12:15:00Z"
      }
    ];
  }

  static generateSampleOrders(): Order[] {
    return [
      {
        id: "ord-001",
        orderNumber: "ORD-2024-001",
        customerId: "cust-001",
        customerName: "Customer Alpha",
        status: "Ready",
        priority: "Normal",
        lines: [
          {
            id: "ol-001",
            sku: "WIDGET-A",
            description: "Premium Widget A",
            quantity: 5,
            pickedQuantity: 0,
            binId: "bin-a1-01",
            pickStatus: "Pending"
          },
          {
            id: "ol-002",
            sku: "GADGET-B",
            variant: "Blue",
            description: "Gadget B - Blue Variant",
            quantity: 2,
            pickedQuantity: 0,
            binId: "bin-a1-02",
            pickStatus: "Pending"
          }
        ],
        createdAt: "2024-01-10T08:00:00Z",
        dueDate: "2024-01-15T17:00:00Z"
      },
      {
        id: "ord-002",
        orderNumber: "ORD-2024-002",
        customerId: "cust-002",
        customerName: "Customer Beta",
        status: "Picking",
        priority: "High",
        lines: [
          {
            id: "ol-003",
            sku: "CABLE-USB",
            description: "USB-C Cable 6ft",
            quantity: 10,
            pickedQuantity: 7,
            binId: "bin-b2-01",
            pickStatus: "In Progress"
          }
        ],
        waveId: "wave-001",
        zone: "B",
        createdAt: "2024-01-11T09:00:00Z",
        dueDate: "2024-01-14T17:00:00Z"
      }
    ];
  }

  static generateSampleWaves(): Wave[] {
    return [
      {
        id: "wave-001",
        waveNumber: "WAVE-001",
        status: "In Progress",
        orderIds: ["ord-002"],
        assignedZones: ["B"],
        assignedPicker: "picker-001",
        createdAt: "2024-01-12T08:00:00Z",
        releasedAt: "2024-01-12T08:30:00Z",
        createdBy: "manager-001"
      },
      {
        id: "wave-002",
        waveNumber: "WAVE-002",
        status: "Draft",
        orderIds: ["ord-001"],
        assignedZones: ["A"],
        createdAt: "2024-01-12T10:00:00Z",
        createdBy: "manager-001"
      }
    ];
  }

  static generateSamplePickTasks(): PickTask[] {
    return [
      {
        id: "pick-001",
        orderId: "ord-002",
        orderLineId: "ol-003",
        waveId: "wave-001",
        sku: "CABLE-USB",
        binLocation: "B2-01",
        quantityToPick: 10,
        quantityPicked: 7,
        status: "In Progress",
        pickerId: "picker-001",
        pickPath: 1,
        zone: "B"
      }
    ];
  }

  static generateSampleExceptions(): WarehouseException[] {
    return [
      {
        id: "exc-001",
        type: "Pick Not Found",
        entityId: "WIDGET-A",
        entityType: "SKU",
        description: "Expected quantity not found in bin A1-01",
        status: "Open",
        reportedBy: "picker-002",
        reportedAt: "2024-01-12T14:30:00Z"
      },
      {
        id: "exc-002",
        type: "Over Capacity",
        entityId: "bin-a1-02",
        entityType: "Bin",
        description: "Bin A1-02 exceeding capacity limit",
        status: "Investigating",
        reportedBy: "associate-001",
        reportedAt: "2024-01-12T11:45:00Z"
      }
    ];
  }

  static calculateWaveKPIs(orders: Order[], waves: Wave[], pickTasks: PickTask[], exceptions: WarehouseException[]): WaveKPIs {
    const openOrders = orders.filter(o => o.status === "Pending").length;
    const readyToPick = orders.filter(o => o.status === "Ready").length;
    const exceptionsCount = exceptions.filter(e => e.status === "Open").length;
    const activeWaves = waves.filter(w => w.status === "In Progress" || w.status === "Released").length;
    const totalPickTasks = pickTasks.length;
    const completedPickTasks = pickTasks.filter(t => t.status === "Picked").length;
    const averagePickTime = 2.5; // Simulated average in minutes

    return {
      openOrders,
      readyToPick,
      exceptionsCount,
      activeWaves,
      totalPickTasks,
      completedPickTasks,
      averagePickTime
    };
  }

  static logAuditEvent(event: Omit<WMSAuditEvent, 'id' | 'timestamp'>): WMSAuditEvent {
    return {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event
    };
  }

  static simulateReceiving(poId: string, sku: string, quantity: number, binId: string, actor: string): {
    inventoryItem: InventoryItem;
    auditEvent: WMSAuditEvent;
  } {
    const inventoryItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku,
      description: `Received ${sku}`,
      binId,
      quantity,
      trackingId: `TRK-${Date.now()}`,
      receivedDate: new Date().toISOString()
    };

    const auditEvent = this.logAuditEvent({
      event: "item_received",
      entityId: inventoryItem.id,
      entityType: "Inventory",
      actor,
      metadata: { poId, binId, quantity }
    });

    return { inventoryItem, auditEvent };
  }

  static simulateWaveRelease(waveId: string, orderIds: string[], zones: string[], actor: string): WMSAuditEvent {
    return this.logAuditEvent({
      event: "wave_released",
      entityId: waveId,
      entityType: "Wave",
      actor,
      previousState: { status: "Draft" },
      newState: { status: "Released" },
      metadata: { orderIds, zones }
    });
  }

  static simulatePick(pickTaskId: string, sku: string, quantityPicked: number, actor: string): WMSAuditEvent {
    return this.logAuditEvent({
      event: "item_picked",
      entityId: pickTaskId,
      entityType: "Order",
      actor,
      metadata: { sku, quantityPicked }
    });
  }

  static simulatePackout(orderId: string, cartonNumber: string, weight: number, dimensions: any, actor: string): {
    carton: PackoutCarton;
    auditEvent: WMSAuditEvent;
  } {
    const carton: PackoutCarton = {
      id: `cart-${Date.now()}`,
      cartonNumber,
      orderId,
      items: [],
      weight,
      dimensions,
      trackingNumber: `TRK-${Date.now()}`,
      packedAt: new Date().toISOString(),
      packedBy: actor
    };

    const auditEvent = this.logAuditEvent({
      event: "carton_packed",
      entityId: carton.id,
      entityType: "Carton",
      actor,
      metadata: { orderId, weight, dimensions }
    });

    return { carton, auditEvent };
  }
}