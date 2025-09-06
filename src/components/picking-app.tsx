import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Package, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  Navigation,
  Target
} from "@phosphor-icons/react";
import { Wave, PickTask, Order, WMSAuditEvent, UserRole, WarehouseException } from "@/lib/types";
import { WMSService } from "@/lib/wms-service";
import { useKV } from "@github/spark/hooks";
import { toast } from "sonner";

interface PickingAppProps {
  userRole: UserRole;
  onBack: () => void;
}

export function PickingApp({ userRole, onBack }: PickingAppProps) {
  const [waves] = useKV<Wave[]>("wms-waves", WMSService.generateSampleWaves());
  const [orders] = useKV<Order[]>("wms-orders", WMSService.generateSampleOrders());
  const [pickTasks, setPickTasks] = useKV<PickTask[]>("wms-pick-tasks", WMSService.generateSamplePickTasks());
  const [auditEvents, setAuditEvents] = useKV<WMSAuditEvent[]>("wms-audit-events", []);
  const [exceptions, setExceptions] = useKV<WarehouseException[]>("wms-exceptions", WMSService.generateSampleExceptions());
  
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const [currentPickTask, setCurrentPickTask] = useState<PickTask | null>(null);
  const [scannedSKU, setScannedSKU] = useState<string>("");
  const [currentZone, setCurrentZone] = useState<string>("");

  // Get available waves for picking
  const availableWaves = waves.filter(w => w.status === "Released" || w.status === "In Progress");

  // Get pick tasks for selected wave and zone
  const getPickTasksForWaveAndZone = (waveId: string, zone: string) => {
    return pickTasks.filter(task => 
      task.waveId === waveId && 
      task.zone === zone &&
      task.status !== "Picked"
    ).sort((a, b) => a.pickPath - b.pickPath);
  };

  // Calculate zone progress
  const getZoneProgress = (waveId: string, zone: string) => {
    const zoneTasks = pickTasks.filter(task => task.waveId === waveId && task.zone === zone);
    const completedTasks = zoneTasks.filter(task => task.status === "Picked");
    return zoneTasks.length > 0 ? (completedTasks.length / zoneTasks.length) * 100 : 0;
  };

  // Start picking a wave
  const handleStartWave = (wave: Wave) => {
    setSelectedWave(wave);
    if (wave.assignedZones.length > 0) {
      setCurrentZone(wave.assignedZones[0]);
      const tasks = getPickTasksForWaveAndZone(wave.id, wave.assignedZones[0]);
      if (tasks.length > 0) {
        setCurrentPickTask(tasks[0]);
      }
    }
  };

  // Switch to different zone
  const handleSwitchZone = (zone: string) => {
    setCurrentZone(zone);
    const tasks = getPickTasksForWaveAndZone(selectedWave!.id, zone);
    if (tasks.length > 0) {
      setCurrentPickTask(tasks[0]);
    } else {
      setCurrentPickTask(null);
    }
    setScannedSKU("");
  };

  // Confirm pick
  const handleConfirmPick = () => {
    if (!currentPickTask || !scannedSKU) {
      toast.error("Please scan the SKU first");
      return;
    }

    if (scannedSKU !== currentPickTask.sku) {
      toast.error("Scanned SKU does not match expected SKU");
      return;
    }

    // Update pick task
    setPickTasks(current => 
      current.map(task => 
        task.id === currentPickTask.id
          ? { 
              ...task, 
              status: "Picked", 
              quantityPicked: task.quantityToPick,
              pickerId: `${userRole}-user`
            }
          : task
      )
    );

    // Log audit event
    const auditEvent = WMSService.simulatePick(
      currentPickTask.id,
      currentPickTask.sku,
      currentPickTask.quantityToPick,
      `${userRole}-user`
    );

    setAuditEvents(current => [...current, auditEvent]);

    toast.success(`Picked ${currentPickTask.quantityToPick} units of ${currentPickTask.sku}`);

    // Move to next task
    const remainingTasks = getPickTasksForWaveAndZone(selectedWave!.id, currentZone)
      .filter(task => task.id !== currentPickTask.id);
    
    if (remainingTasks.length > 0) {
      setCurrentPickTask(remainingTasks[0]);
    } else {
      setCurrentPickTask(null);
      toast.success(`Zone ${currentZone} picking completed!`);
    }
    
    setScannedSKU("");
  };

  // Report "Not Found"
  const handleNotFound = () => {
    if (!currentPickTask) return;

    // Create exception
    const exception: WarehouseException = {
      id: `exc-${Date.now()}`,
      type: "Pick Not Found",
      entityId: currentPickTask.sku,
      entityType: "SKU",
      description: `${currentPickTask.sku} not found at location ${currentPickTask.binLocation}`,
      status: "Open",
      reportedBy: `${userRole}-user`,
      reportedAt: new Date().toISOString()
    };

    setExceptions(current => [...current, exception]);

    // Update pick task status
    setPickTasks(current => 
      current.map(task => 
        task.id === currentPickTask.id
          ? { ...task, status: "Not Found" }
          : task
      )
    );

    toast.error("Item not found - exception logged");

    // Move to next task
    const remainingTasks = getPickTasksForWaveAndZone(selectedWave!.id, currentZone)
      .filter(task => task.id !== currentPickTask.id);
    
    if (remainingTasks.length > 0) {
      setCurrentPickTask(remainingTasks[0]);
    } else {
      setCurrentPickTask(null);
    }
    
    setScannedSKU("");
  };

  // Get pick path for zone
  const getPickPath = (waveId: string, zone: string) => {
    return getPickTasksForWaveAndZone(waveId, zone)
      .map((task, index) => ({
        step: index + 1,
        location: task.binLocation,
        sku: task.sku,
        quantity: task.quantityToPick,
        status: task.status,
        isCurrent: currentPickTask?.id === task.id
      }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Picking App</h1>
          <p className="text-muted-foreground">Mobile-optimized picking interface</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      {!selectedWave ? (
        /* Wave Selection */
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Wave to Pick</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableWaves.map((wave) => (
                  <div key={wave.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wave.waveNumber}</span>
                        <Badge variant={wave.status === "Released" ? "default" : "secondary"}>
                          {wave.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {wave.orderIds.length} orders • Zones: {wave.assignedZones.join(", ")}
                      </p>
                      {wave.assignedPicker && (
                        <p className="text-xs text-muted-foreground">
                          Assigned to: {wave.assignedPicker}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => handleStartWave(wave)}>
                      Start Picking
                    </Button>
                  </div>
                ))}
                {availableWaves.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No waves available for picking. Please check with your manager.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Picking Interface */
        <div className="space-y-6">
          {/* Wave Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedWave.waveNumber}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedWave.orderIds.length} orders across {selectedWave.assignedZones.length} zones
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedWave(null)}>
                  Switch Wave
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Zone Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Zone Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedWave.assignedZones.map((zone) => {
                  const progress = getZoneProgress(selectedWave.id, zone);
                  const isActive = zone === currentZone;
                  
                  return (
                    <div
                      key={zone}
                      className={`p-4 border rounded cursor-pointer transition-colors ${
                        isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSwitchZone(zone)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Zone {zone}</span>
                        {isActive && <Target className="h-4 w-4 text-primary" />}
                      </div>
                      <Progress value={progress} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(progress)}% complete
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {currentZone && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Pick Task */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Current Pick
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPickTask ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold">{currentPickTask.binLocation}</span>
                          <Badge variant="outline">Step {currentPickTask.pickPath}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">SKU:</span>
                            <span className="font-medium">{currentPickTask.sku}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{currentPickTask.quantityToPick}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Order:</span>
                            <span className="font-medium">{currentPickTask.orderId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Scan SKU to Confirm</label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Scan SKU..."
                              value={scannedSKU}
                              onChange={(e) => setScannedSKU(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleConfirmPick()}
                            />
                            <Button size="icon" onClick={handleConfirmPick}>
                              <Scan className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleConfirmPick} 
                            className="flex-1"
                            disabled={!scannedSKU || scannedSKU !== currentPickTask.sku}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Pick
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleNotFound}
                            className="flex-1"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Not Found
                          </Button>
                        </div>
                      </div>

                      {scannedSKU && scannedSKU !== currentPickTask.sku && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            SKU mismatch! Expected: {currentPickTask.sku}, Scanned: {scannedSKU}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        All picks completed for Zone {currentZone}!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Pick Path */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Pick Path - Zone {currentZone}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getPickPath(selectedWave.id, currentZone).map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 border rounded ${
                          step.isCurrent 
                            ? "border-primary bg-primary/5" 
                            : step.status === "Picked"
                            ? "border-green-200 bg-green-50"
                            : step.status === "Not Found"
                            ? "border-red-200 bg-red-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.isCurrent
                              ? "bg-primary text-primary-foreground"
                              : step.status === "Picked"
                              ? "bg-green-500 text-white"
                              : step.status === "Not Found"
                              ? "bg-red-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {step.step}
                          </div>
                          <div>
                            <div className="font-medium">{step.location}</div>
                            <div className="text-sm text-muted-foreground">
                              {step.sku} × {step.quantity}
                            </div>
                          </div>
                        </div>
                        <div>
                          {step.status === "Picked" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {step.status === "Not Found" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {step.isCurrent && <Target className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}