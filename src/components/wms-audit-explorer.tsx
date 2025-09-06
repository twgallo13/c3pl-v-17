import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Filter, 
  Calendar, 
  User, 
  Package, 
  Waves,
  Truck,
  AlertTriangle,
  Search
} from "@phosphor-icons/react";
import { WMSAuditEvent } from "@/lib/types";
import { useKV } from "@github/spark/hooks";

interface WMSAuditExplorerProps {
  className?: string;
}

export function WMSAuditExplorer({ className }: WMSAuditExplorerProps) {
  const [auditEvents] = useKV<WMSAuditEvent[]>("wms-audit-events", []);
  const [filteredEvents, setFilteredEvents] = useState<WMSAuditEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WMSAuditEvent | null>(null);
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Apply filters
  const applyFilters = () => {
    let filtered = [...auditEvents];

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(event => event.event === eventTypeFilter);
    }

    if (entityTypeFilter !== "all") {
      filtered = filtered.filter(event => event.entityType === entityTypeFilter);
    }

    if (actorFilter) {
      filtered = filtered.filter(event => 
        event.actor.toLowerCase().includes(actorFilter.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(event.metadata || {}).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredEvents(filtered);
  };

  // Clear filters
  const clearFilters = () => {
    setEventTypeFilter("all");
    setEntityTypeFilter("all");
    setActorFilter("");
    setSearchTerm("");
    setFilteredEvents([]);
  };

  // Get event icon
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "po_scanned":
      case "item_received":
        return <Package className="h-4 w-4" />;
      case "wave_released":
        return <Waves className="h-4 w-4" />;
      case "item_picked":
        return <Package className="h-4 w-4" />;
      case "carton_packed":
      case "order_shipped":
        return <Truck className="h-4 w-4" />;
      case "exception_raised":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  // Get event color
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "po_scanned":
      case "item_received":
        return "bg-blue-100 text-blue-800";
      case "wave_released":
        return "bg-purple-100 text-purple-800";
      case "item_picked":
        return "bg-green-100 text-green-800";
      case "carton_packed":
      case "order_shipped":
        return "bg-orange-100 text-orange-800";
      case "exception_raised":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format event type for display
  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const eventsToShow = filteredEvents.length > 0 ? filteredEvents : auditEvents;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            WMS Audit Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Event Type</Label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="po_scanned">PO Scanned</SelectItem>
                  <SelectItem value="item_received">Item Received</SelectItem>
                  <SelectItem value="wave_released">Wave Released</SelectItem>
                  <SelectItem value="item_picked">Item Picked</SelectItem>
                  <SelectItem value="carton_packed">Carton Packed</SelectItem>
                  <SelectItem value="order_shipped">Order Shipped</SelectItem>
                  <SelectItem value="exception_raised">Exception Raised</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="PO">Purchase Order</SelectItem>
                  <SelectItem value="Inventory">Inventory</SelectItem>
                  <SelectItem value="Wave">Wave</SelectItem>
                  <SelectItem value="Order">Order</SelectItem>
                  <SelectItem value="Carton">Carton</SelectItem>
                  <SelectItem value="Exception">Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Actor</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Filter by actor..."
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Search</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Search entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters}>
              <Filter className="h-3 w-3 mr-1" />
              Apply Filters
            </Button>
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>

          {/* Events List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Audit Events</h3>
                <Badge variant="outline" className="text-xs">
                  {eventsToShow.length} events
                </Badge>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {eventsToShow.slice(0, 50).map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                        selectedEvent?.id === event.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded ${getEventColor(event.event)}`}>
                          {getEventIcon(event.event)}
                        </div>
                        <span className="font-medium">{formatEventType(event.event)}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.entityType}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        <div>Entity: {event.entityId}</div>
                        <div>Actor: {event.actor}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {eventsToShow.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-xs">
                      No audit events found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Event Details */}
            <div>
              <h3 className="font-medium text-sm mb-2">Event Details</h3>
              <Card className="h-64">
                <CardContent className="p-3">
                  {selectedEvent ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${getEventColor(selectedEvent.event)}`}>
                            {getEventIcon(selectedEvent.event)}
                          </div>
                          <span className="font-medium">{formatEventType(selectedEvent.event)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Entity ID:</span>
                            <div className="font-mono">{selectedEvent.entityId}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entity Type:</span>
                            <div>{selectedEvent.entityType}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actor:</span>
                            <div>{selectedEvent.actor}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timestamp:</span>
                            <div>{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {selectedEvent.previousState && (
                        <div>
                          <span className="text-muted-foreground">Previous State:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(selectedEvent.previousState, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedEvent.newState && (
                        <div>
                          <span className="text-muted-foreground">New State:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(selectedEvent.newState, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedEvent.metadata && (
                        <div>
                          <span className="text-muted-foreground">Metadata:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(selectedEvent.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      Select an event to view details
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-sm font-bold">
                {auditEvents.filter(e => e.event === "po_scanned").length}
              </div>
              <div className="text-xs text-muted-foreground">PO Scans</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-sm font-bold">
                {auditEvents.filter(e => e.event === "wave_released").length}
              </div>
              <div className="text-xs text-muted-foreground">Waves Released</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-sm font-bold">
                {auditEvents.filter(e => e.event === "item_picked").length}
              </div>
              <div className="text-xs text-muted-foreground">Items Picked</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-sm font-bold">
                {auditEvents.filter(e => e.event === "carton_packed").length}
              </div>
              <div className="text-xs text-muted-foreground">Cartons Packed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}