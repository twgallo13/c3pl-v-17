import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  RotateCcw, 
  Waves, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendUp
} from "@phosphor-icons/react";
import { Order, Wave, PickTask } from "@/lib/types";
import { WMSService } from "@/lib/wms-service";
import { useKV } from "@github/spark/hooks";
import { toast } from "sonner";

interface WaveSimulationToolProps {
  className?: string;
}

interface SimulationResult {
  waveId: string;
  zones: string[];
  orderCount: number;
  totalPickTasks: number;
  estimatedTime: number;
  efficiency: number;
  conflicts: string[];
  recommendations: string[];
}

export function WaveSimulationTool({ className }: WaveSimulationToolProps) {
  const [orders] = useKV<Order[]>("wms-orders", WMSService.generateSampleOrders());
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [pickerCount, setPickerCount] = useState<number>(1);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const availableZones = ["A", "B", "C", "D"];
  const availableOrders = orders.filter(order => order.status === "Ready" && !order.waveId);

  // Handle order selection
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

  // Calculate simulation metrics
  const calculateSimulation = (): SimulationResult => {
    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    
    // Calculate total pick tasks
    const totalPickTasks = selectedOrdersData.reduce((sum, order) => sum + order.lines.length, 0);
    
    // Estimate time based on pick tasks and zones
    const tasksPerZone = Math.ceil(totalPickTasks / selectedZones.length);
    const timePerTask = 2.5; // minutes
    const baseTime = tasksPerZone * timePerTask;
    const parallelTime = baseTime / Math.min(pickerCount, selectedZones.length);
    
    // Calculate efficiency (higher is better)
    const efficiency = Math.max(60 - (tasksPerZone * 2), 30) + (pickerCount > 1 ? 10 : 0);
    
    // Identify conflicts and issues
    const conflicts: string[] = [];
    const recommendations: string[] = [];
    
    if (selectedZones.length > pickerCount) {
      conflicts.push(`More zones (${selectedZones.length}) than pickers (${pickerCount})`);
      recommendations.push("Consider adding more pickers or reducing zones");
    }
    
    if (totalPickTasks > 50) {
      conflicts.push("High pick task count may cause delays");
      recommendations.push("Consider splitting into multiple waves");
    }
    
    if (selectedZones.length === 1 && totalPickTasks > 20) {
      conflicts.push("Single zone with many tasks may create bottleneck");
      recommendations.push("Distribute tasks across multiple zones");
    }
    
    const hasHighPriority = selectedOrdersData.some(order => order.priority === "High" || order.priority === "Urgent");
    if (hasHighPriority && totalPickTasks > 30) {
      conflicts.push("High priority orders mixed with large wave");
      recommendations.push("Consider prioritizing urgent orders in separate wave");
    }
    
    if (efficiency > 80) {
      recommendations.push("Excellent wave configuration!");
    } else if (efficiency > 60) {
      recommendations.push("Good wave balance");
    } else {
      recommendations.push("Wave may be inefficient - consider optimization");
    }

    return {
      waveId: `sim-wave-${Date.now()}`,
      zones: selectedZones,
      orderCount: selectedOrders.length,
      totalPickTasks,
      estimatedTime: Math.round(parallelTime),
      efficiency: Math.round(efficiency),
      conflicts,
      recommendations
    };
  };

  // Run simulation
  const runSimulation = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }
    
    if (selectedZones.length === 0) {
      toast.error("Please select at least one zone");
      return;
    }
    
    setIsRunning(true);
    
    // Simulate processing time
    setTimeout(() => {
      const result = calculateSimulation();
      setSimulationResult(result);
      setIsRunning(false);
      toast.success("Simulation completed");
    }, 1500);
  };

  // Reset simulation
  const resetSimulation = () => {
    setSelectedOrders([]);
    setSelectedZones([]);
    setPickerCount(1);
    setSimulationResult(null);
  };

  // Get order priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "destructive";
      case "High": return "default";
      case "Normal": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  // Get efficiency color
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "text-green-600";
    if (efficiency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Wave Simulation Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Configuration */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Select Orders ({selectedOrders.length} selected)</Label>
                <div className="border rounded p-3 max-h-40 overflow-y-auto space-y-2">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => 
                          handleOrderSelection(order.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{order.orderNumber}</span>
                          <Badge variant={getPriorityColor(order.priority)} className="text-xs">
                            {order.priority}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {order.customerName} • {order.lines.length} items
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableOrders.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-2">
                      No orders available for simulation
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Assign Zones</Label>
                <div className="flex flex-wrap gap-2 mt-1">
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
                <Label htmlFor="picker-count" className="text-sm font-medium">Number of Pickers</Label>
                <Select value={pickerCount.toString()} onValueChange={(value) => setPickerCount(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Picker</SelectItem>
                    <SelectItem value="2">2 Pickers</SelectItem>
                    <SelectItem value="3">3 Pickers</SelectItem>
                    <SelectItem value="4">4 Pickers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runSimulation} 
                  disabled={isRunning || selectedOrders.length === 0 || selectedZones.length === 0}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetSimulation}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Results */}
            <div>
              <Label className="text-sm font-medium">Simulation Results</Label>
              {simulationResult ? (
                <div className="space-y-4 mt-2">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-lg font-bold">{simulationResult.orderCount}</div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-lg font-bold">{simulationResult.totalPickTasks}</div>
                      <div className="text-xs text-muted-foreground">Pick Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-lg font-bold">{simulationResult.estimatedTime}m</div>
                      <div className="text-xs text-muted-foreground">Est. Time</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className={`text-lg font-bold ${getEfficiencyColor(simulationResult.efficiency)}`}>
                        {simulationResult.efficiency}%
                      </div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                  </div>

                  {/* Zone Distribution */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Zone Distribution</h4>
                    <div className="space-y-1">
                      {simulationResult.zones.map((zone) => {
                        const tasksInZone = Math.ceil(simulationResult.totalPickTasks / simulationResult.zones.length);
                        return (
                          <div key={zone} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              Zone {zone}
                            </div>
                            <span>~{tasksInZone} tasks</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conflicts */}
                  {simulationResult.conflicts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-amber-600">Potential Issues</h4>
                      <div className="space-y-1">
                        {simulationResult.conflicts.map((conflict, index) => (
                          <Alert key={index} className="text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription>{conflict}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-600">Recommendations</h4>
                    <div className="space-y-1">
                      {simulationResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-xs border rounded mt-2">
                  Configure wave parameters and run simulation to see results
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">
                {availableOrders.length}
              </div>
              <div className="text-xs text-muted-foreground">Available Orders</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">
                {availableZones.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Zones</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">
                {selectedOrders.length}
              </div>
              <div className="text-xs text-muted-foreground">Selected Orders</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-600">
                {selectedZones.length}
              </div>
              <div className="text-xs text-muted-foreground">Selected Zones</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}