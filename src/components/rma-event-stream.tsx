/**
 * C3PL V17.1.2 RMA Event Stream
 * Debugger tool for visualizing RMA events with filters
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { rmaService } from "@/lib/rma-service";
import { RMAEvent } from "@/lib/types";
import { 
  Activity, 
  Filter, 
  RefreshCw, 
  Search,
  Calendar,
  User,
  Package
} from "@phosphor-icons/react";

export function RMAEventStream() {
  const [events, setEvents] = useState<RMAEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<RMAEvent[]>([]);
  const [filters, setFilters] = useState({
    rmaId: "",
    action: "",
    actor: "",
    dateFrom: "",
    dateTo: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = rmaService.getRMAEvents();
      setEvents(allEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error("Failed to load RMA events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.rmaId) {
      filtered = filtered.filter(event => 
        event.rma_id.toLowerCase().includes(filters.rmaId.toLowerCase())
      );
    }

    if (filters.action && filters.action !== "all") {
      filtered = filtered.filter(event => event.action === filters.action);
    }

    if (filters.actor) {
      filtered = filtered.filter(event => 
        event.actor.toLowerCase().includes(filters.actor.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(event => 
        new Date(event.timestamp) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(event => 
        new Date(event.timestamp) <= toDate
      );
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setFilters({
      rmaId: "",
      action: "",
      actor: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  const getActionColor = (action: RMAEvent["action"]) => {
    switch (action) {
      case "rma_created": return "bg-blue-100 text-blue-800";
      case "rma_processed": return "bg-green-100 text-green-800";
      case "credit_memo_issued": return "bg-purple-100 text-purple-800";
      case "gl_posted": return "bg-yellow-100 text-yellow-800";
      case "disposition_assigned": return "bg-orange-100 text-orange-800";
      case "return_label_printed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: RMAEvent["action"]) => {
    switch (action) {
      case "rma_created": return <Package className="h-3 w-3" />;
      case "rma_processed": return <Activity className="h-3 w-3" />;
      case "credit_memo_issued": return <Activity className="h-3 w-3" />;
      case "gl_posted": return <Activity className="h-3 w-3" />;
      case "disposition_assigned": return <Activity className="h-3 w-3" />;
      case "return_label_printed": return <Activity className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const uniqueActions = Array.from(new Set(events.map(e => e.action)));
  const uniqueActors = Array.from(new Set(events.map(e => e.actor)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          RMA Event Stream
          <Badge variant="outline" className="ml-auto">
            {filteredEvents.length} / {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
            <Button 
              onClick={clearFilters}
              variant="ghost" 
              size="sm"
              className="ml-auto text-xs"
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">RMA ID</label>
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="RMA-2024-001"
                  value={filters.rmaId}
                  onChange={(e) => setFilters(prev => ({ ...prev, rmaId: e.target.value }))}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Action</label>
              <Select 
                value={filters.action} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Actor</label>
              <Select 
                value={filters.actor} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, actor: value }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All actors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actors</SelectItem>
                  {uniqueActors.map(actor => (
                    <SelectItem key={actor} value={actor}>
                      {actor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} events
          </div>
          <Button 
            onClick={loadEvents}
            disabled={isLoading}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Event List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                className="p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getActionColor(event.action)} text-xs px-2 py-0 h-5 flex items-center gap-1`}>
                        {getActionIcon(event.action)}
                        {event.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{event.rma_id}</span>
                      {event.line_id && (
                        <Badge variant="outline" className="text-xs">
                          {event.line_id}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.actor}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {event.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <pre className="font-mono overflow-auto max-w-full">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {events.length === 0 ? "No RMA events found" : "No events match current filters"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}