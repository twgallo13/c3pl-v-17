/**
 * Network Request Inspector Component for C3PL V17.0.1
 * View API calls, payloads, response times, error codes
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Network, Clock, AlertCircle, CheckCircle, Search } from "@phosphor-icons/react";
import { NetworkRequest } from "@/lib/types";
import { useKV } from "@github/spark/hooks";
import { createLogEntry, formatLogEntry } from "@/lib/constants";

export function NetworkInspector() {
  const [requests, setRequests] = useKV<NetworkRequest[]>("c3pl-network-requests", []);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate a network request for testing
  const simulateRequest = async (url: string, method: string, shouldFail: boolean = false) => {
    const actor = "network-inspector";
    const startTime = Date.now();
    
    console.log(formatLogEntry(createLogEntry("info", `Simulating ${method} request to ${url}`, actor, "network")));

    const request: NetworkRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      method,
      url,
      payload: method !== "GET" ? { test: "data", timestamp: new Date().toISOString() } : null,
      response: null,
      responseTime: 0,
      statusCode: 0,
      actor
    };

    // Add to requests immediately to show pending state
    setRequests(current => [request, ...current]);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      const responseTime = Date.now() - startTime;
      
      if (shouldFail) {
        const errorCode = Math.random() > 0.5 ? "NETWORK_ERROR" : "TIMEOUT";
        const statusCode = errorCode === "NETWORK_ERROR" ? 500 : 408;
        
        const updatedRequest = {
          ...request,
          response: { error: "Request failed", code: errorCode },
          responseTime,
          statusCode,
          errorCode
        };

        setRequests(current => 
          current.map(req => req.id === request.id ? updatedRequest : req)
        );

        console.error(formatLogEntry(createLogEntry("error", `Request failed: ${method} ${url} - ${statusCode} ${errorCode}`, actor, "network")));
      } else {
        const statusCode = 200;
        const response = {
          success: true,
          data: { message: "Request successful", timestamp: new Date().toISOString() },
          headers: { "content-type": "application/json" }
        };

        const updatedRequest = {
          ...request,
          response,
          responseTime,
          statusCode
        };

        setRequests(current => 
          current.map(req => req.id === request.id ? updatedRequest : req)
        );

        console.log(formatLogEntry(createLogEntry("info", `Request completed: ${method} ${url} - ${statusCode} (${responseTime}ms)`, actor, "network")));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(formatLogEntry(createLogEntry("error", `Request exception: ${errorMessage}`, actor, "network")));
    }
  };

  const clearRequests = () => {
    setRequests([]);
    setSelectedRequest(null);
    console.log(formatLogEntry(createLogEntry("info", "Network requests cleared", "network-inspector", "network")));
  };

  const filteredRequests = requests.filter(req => 
    req.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (statusCode: number) => {
    if (statusCode === 0) return "secondary"; // Pending
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 400) return "destructive";
    return "secondary";
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 500) return "text-green-600";
    if (responseTime < 1000) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network size={20} />
          Network Inspector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            onClick={() => simulateRequest("https://api.c3pl.dev/users", "GET")}
          >
            Test GET
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => simulateRequest("https://api.c3pl.dev/users", "POST")}
          >
            Test POST
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => simulateRequest("https://api.c3pl.dev/error", "GET", true)}
          >
            Test Error
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={clearRequests}
          >
            Clear
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Request List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No network requests yet. Click "Test GET" to simulate one.
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedRequest?.id === request.id ? "bg-muted border-primary" : ""
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={request.statusCode === 0 ? "secondary" : "outline"}>
                        {request.method}
                      </Badge>
                      <Badge variant={getStatusColor(request.statusCode)}>
                        {request.statusCode === 0 ? "Pending" : request.statusCode}
                      </Badge>
                      {request.errorCode && (
                        <Badge variant="destructive" className="text-xs">
                          {request.errorCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} />
                      <span className={getResponseTimeColor(request.responseTime)}>
                        {request.responseTime}ms
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground truncate">
                    {request.url}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Request Details */}
        {selectedRequest && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {selectedRequest.statusCode >= 400 ? (
                  <AlertCircle size={16} className="text-destructive" />
                ) : selectedRequest.statusCode > 0 ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Clock size={16} className="text-muted-foreground" />
                )}
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Method:</span>
                      <span className="ml-2">{selectedRequest.method}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2">{selectedRequest.statusCode || "Pending"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Response Time:</span>
                      <span className="ml-2">{selectedRequest.responseTime}ms</span>
                    </div>
                    <div>
                      <span className="font-medium">Actor:</span>
                      <span className="ml-2">{selectedRequest.actor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">URL:</span>
                    <div className="mt-1 p-2 bg-muted rounded font-mono text-sm break-all">
                      {selectedRequest.url}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="payload">
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {selectedRequest.payload ? 
                      JSON.stringify(selectedRequest.payload, null, 2) : 
                      "No payload"
                    }
                  </pre>
                </TabsContent>
                
                <TabsContent value="response">
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {selectedRequest.response ? 
                      JSON.stringify(selectedRequest.response, null, 2) : 
                      "No response yet"
                    }
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}