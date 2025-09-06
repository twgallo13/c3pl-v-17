import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Waves, 
  TrendUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Plus,
  Play,
  Pause,
  X
} from "@phosphor-icons/react";
import { Order, Wave, WarehouseException, WaveKPIs, UserRole, WMSAuditEvent } from "@/lib/types";
import { WMSService } from "@/lib/wms-service";
import { useKV } from "@github/spark/hooks";
import { toast } from "sonner";

interface WaveControlDashboardProps {
  userRole: UserRole;
  onBack: () => void;
}

export function WaveControlDashboard({ userRole, onBack }: WaveControlDashboardProps) {
  const [orders, setOrders] = useKV<Order[]>("wms-orders", WMSService.generateSampleOrders());
  const [waves, setWaves] = useKV<Wave[]>("wms-waves", WMSService.generateSampleWaves());
  const [exceptions] = useKV<WarehouseException[]>("wms-exceptions", WMSService.generateSampleExceptions());
  const [auditEvents, setAuditEvents] = useKV<WMSAuditEvent[]>("wms-audit-events", []);
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [assignedPicker, setAssignedPicker] = useState<string>("");
  const [isWaveBuilderOpen, setIsWaveBuilderOpen] = useState(false);

  // Calculate KPIs
  const kpis = WMSService.calculateWaveKPIs(orders, waves, [], exceptions);

  // Available zones
  const availableZones = ["A", "B", "C", "D"];
  const availablePickers = ["picker-001", "picker-002", "picker-003"];

  // Get ready orders (not assigned to waves)
  const readyOrders = orders.filter(order => 
    order.status === "Ready" && !order.waveId
  );

  // Handle order selection for wave building
  const handleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => 
      checked 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  // Handle zone selection
  const handleZoneSelection = (zone: string, checked: boolean) => {
    setSelectedZones(prev => 
      checked 
        ? [...prev, zone]
        : prev.filter(z => z !== zone)
    );
  };

  // Create new wave
  const handleCreateWave = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    if (selectedZones.length === 0) {
      toast.error("Please select at least one zone");
      return;
    }

    const newWave: Wave = {
      id: `wave-${Date.now()}`,
      waveNumber: `WAVE-${waves.length + 1}`.padStart(8, '0'),
      status: "Draft",
      orderIds: selectedOrders,
      assignedZones: selectedZones,
      assignedPicker: assignedPicker || undefined,
      createdAt: new Date().toISOString(),
      createdBy: `${userRole}-user`
    };

    // Update orders with wave assignment
    setOrders(current => 
      current.map(order => 
        selectedOrders.includes(order.id)
          ? { ...order, waveId: newWave.id, zone: selectedZones[0] }
          : order
      )
    );

    setWaves(current => [...current, newWave]);

    // Log audit event
    const auditEvent = WMSService.logAuditEvent({
      event: "wave_released",
      entityId: newWave.id,
      entityType: "Wave",
      actor: `${userRole}-user`,
      metadata: { 
        orderCount: selectedOrders.length, 
        zones: selectedZones,
        picker: assignedPicker 
      }
    });

    setAuditEvents(current => [...current, auditEvent]);

    toast.success(`Wave ${newWave.waveNumber} created successfully`);
    
    // Reset form
    setSelectedOrders([]);
    setSelectedZones([]);
    setAssignedPicker("");
    setIsWaveBuilderOpen(false);
  };

  // Release wave
  const handleReleaseWave = (waveId: string) => {
    setWaves(current => 
      current.map(wave => 
        wave.id === waveId
          ? { ...wave, status: "Released", releasedAt: new Date().toISOString() }
          : wave
      )
    );

    const auditEvent = WMSService.simulateWaveRelease(
      waveId, 
      [], 
      [], 
      `${userRole}-user`
    );

    setAuditEvents(current => [...current, auditEvent]);
    toast.success("Wave released for picking");
  };

  // Cancel wave
  const handleCancelWave = (waveId: string) => {
    const wave = waves.find(w => w.id === waveId);
    if (!wave) return;

    // Remove wave assignment from orders
    setOrders(current => 
      current.map(order => 
        wave.orderIds.includes(order.id)
          ? { ...order, waveId: undefined, zone: undefined }
          : order
      )
    );

    setWaves(current => 
      current.map(w => 
        w.id === waveId
          ? { ...w, status: "Cancelled" }
          : w
      )
    );

    toast.success("Wave cancelled");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "secondary";
      case "Released": return "default";
      case "In Progress": return "default";
      case "Completed": return "default";
      case "Cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "destructive";
      case "High": return "default";
      case "Normal": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wave Control Dashboard</h1>
          <p className="text-muted-foreground">Manage picking waves and monitor warehouse operations</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Orders</p>
                <p className="text-2xl font-bold">{kpis.openOrders}</p>
              </div>
              <TrendUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Pick</p>
                <p className="text-2xl font-bold">{kpis.readyToPick}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exceptions</p>
                <p className="text-2xl font-bold">{kpis.exceptionsCount}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Waves</p>
                <p className="text-2xl font-bold">{kpis.activeWaves}</p>
              </div>
              <Waves className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wave Builder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5" />
              Wave Builder
            </CardTitle>
            <Dialog open={isWaveBuilderOpen} onOpenChange={setIsWaveBuilderOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Wave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Wave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Select Orders ({selectedOrders.length} selected)</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {readyOrders.map((order) => (
                        <div key={order.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => 
                              handleOrderSelection(order.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{order.orderNumber}</span>
                              <Badge variant={getPriorityColor(order.priority)}>
                                {order.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.lines.length} items • Due: {new Date(order.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Assign Zones</h3>
                    <div className="flex gap-2">
                      {availableZones.map((zone) => (
                        <div key={zone} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedZones.includes(zone)}
                            onCheckedChange={(checked) => 
                              handleZoneSelection(zone, checked as boolean)
                            }
                          />
                          <label className="text-sm">Zone {zone}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Assign Picker (Optional)</h3>
                    <Select value={assignedPicker} onValueChange={setAssignedPicker}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select picker..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePickers.map((picker) => (
                          <SelectItem key={picker} value={picker}>
                            {picker}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCreateWave} className="w-full">
                    Create Wave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {readyOrders.length} orders ready for wave assignment
              </p>
              <div className="space-y-2">
                {readyOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{order.orderNumber}</span>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <Badge variant={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </div>
                ))}
                {readyOrders.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{readyOrders.length - 3} more orders
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exception Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Exception Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exceptions.filter(e => e.status === "Open").map((exception) => (
                <Alert key={exception.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exception.type}</p>
                        <p className="text-sm">{exception.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported by {exception.reportedBy} • {new Date(exception.reportedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {exception.status}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              {exceptions.filter(e => e.status === "Open").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No open exceptions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Waves */}
      <Card>
        <CardHeader>
          <CardTitle>Active Waves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {waves.filter(w => w.status !== "Cancelled").map((wave) => (
              <div key={wave.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{wave.waveNumber}</span>
                    <Badge variant={getStatusColor(wave.status)}>
                      {wave.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {wave.orderIds.length} orders • Zones: {wave.assignedZones.join(", ")}
                    {wave.assignedPicker && ` • Picker: ${wave.assignedPicker}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(wave.createdAt).toLocaleString()}
                    {wave.releasedAt && ` • Released: ${new Date(wave.releasedAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {wave.status === "Draft" && (
                    <>
                      <Button size="sm" onClick={() => handleReleaseWave(wave.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Release
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCancelWave(wave.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {wave.status === "Released" && (
                    <Button size="sm" variant="outline" disabled>
                      <Users className="h-4 w-4 mr-2" />
                      In Picking
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {waves.filter(w => w.status !== "Cancelled").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active waves
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}