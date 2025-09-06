/**
 * Error Replayer Component for C3PL V17.0.1
 * Replay failed actions with attached logs for debugging
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle, StopCircle, Bug, Clock, CheckCircle, XCircle } from "@phosphor-icons/react";
import { ErrorReplayData } from "@/lib/types";
import { getReplayableActions, replayError, createSimulatedError } from "@/lib/error-replay";
import { useKV } from "@github/spark/hooks";
import { createLogEntry, formatLogEntry } from "@/lib/constants";

export function ErrorReplayer() {
  const [errorHistory, setErrorHistory] = useKV<ErrorReplayData[]>("c3pl-error-history", []);
  const [selectedError, setSelectedError] = useState<ErrorReplayData | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<{ success: boolean; result?: any; error?: string } | null>(null);
  
  // For creating simulated errors
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [payloadText, setPayloadText] = useState("");

  const replayableActions = getReplayableActions();

  const createTestError = () => {
    if (!selectedAction) {
      console.warn(formatLogEntry(createLogEntry("warn", "No action selected for error simulation", "error-replayer", "error-replayer")));
      return;
    }

    try {
      const payload = payloadText.trim() ? JSON.parse(payloadText) : {};
      const errorData = createSimulatedError(selectedAction, payload, "error-replayer");
      
      setErrorHistory(current => [errorData, ...current]);
      setSelectedError(errorData);
      
      console.log(formatLogEntry(createLogEntry("info", `Simulated error created for ${selectedAction}`, "error-replayer", "error-replayer")));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON";
      console.error(formatLogEntry(createLogEntry("error", `Failed to create simulated error: ${errorMessage}`, "error-replayer", "error-replayer")));
    }
  };

  const handleReplay = async (errorData: ErrorReplayData) => {
    setIsReplaying(true);
    setReplayResult(null);
    
    try {
      const result = await replayError(errorData, "error-replayer");
      setReplayResult(result);
      
      console.log(formatLogEntry(createLogEntry(
        result.success ? "info" : "error",
        `Replay ${result.success ? "completed" : "failed"} for ${errorData.action}`,
        "error-replayer",
        "error-replayer"
      )));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setReplayResult({ success: false, error: errorMessage });
      console.error(formatLogEntry(createLogEntry("error", `Replay exception: ${errorMessage}`, "error-replayer", "error-replayer")));
    } finally {
      setIsReplaying(false);
    }
  };

  const clearHistory = () => {
    setErrorHistory([]);
    setSelectedError(null);
    setReplayResult(null);
    console.log(formatLogEntry(createLogEntry("info", "Error history cleared", "error-replayer", "error-replayer")));
  };

  const loadSamplePayload = () => {
    if (!selectedAction) return;

    const samplePayloads: Record<string, any> = {
      "api-call": {
        url: "https://api.c3pl.dev/users/123",
        method: "GET"
      },
      "firestore-write": {
        collection: "users",
        document: "user-123",
        data: { name: "Test User", email: "test@example.com" }
      },
      "user-authentication": {
        username: "test_user",
        password: "test_password"
      }
    };

    const sample = samplePayloads[selectedAction];
    if (sample) {
      setPayloadText(JSON.stringify(sample, null, 2));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug size={20} />
          Error Replayer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="replay">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="replay">Replay Errors</TabsTrigger>
            <TabsTrigger value="simulate">Simulate Error</TabsTrigger>
          </TabsList>

          <TabsContent value="replay" className="space-y-4">
            {/* Error History */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Error History</h3>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {errorHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No errors captured yet. Use "Simulate Error" tab to create test errors.
                  </div>
                ) : (
                  errorHistory.map((error, index) => (
                    <div
                      key={error.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedError?.id === error.id ? "bg-muted border-primary" : ""
                      }`}
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{error.action}</Badge>
                          <Badge variant="secondary">{error.module}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={14} />
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </div>
                      <div className="text-sm text-red-600 truncate">
                        {error.errorMessage}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Actor: {error.actor} • {error.logs.length} logs attached
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Replay Controls */}
            {selectedError && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Replay Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedError.action}</div>
                      <div className="text-sm text-muted-foreground">
                        Module: {selectedError.module} • Actor: {selectedError.actor}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleReplay(selectedError)}
                      disabled={isReplaying}
                      className="flex items-center gap-2"
                    >
                      {isReplaying ? (
                        <>
                          <StopCircle size={16} />
                          Replaying...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={16} />
                          Replay Error
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Replay Result */}
                  {replayResult && (
                    <div className={`p-3 rounded border-2 ${
                      replayResult.success 
                        ? "border-green-500/50 bg-green-50/50"
                        : "border-red-500/50 bg-red-50/50"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {replayResult.success ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <XCircle className="text-red-600" size={20} />
                        )}
                        <span className="font-medium">
                          Replay {replayResult.success ? "Successful" : "Failed"}
                        </span>
                      </div>
                      {replayResult.error && (
                        <div className="text-sm text-red-600 mb-2">
                          {replayResult.error}
                        </div>
                      )}
                      {replayResult.result && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(replayResult.result, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Error Details */}
                  <Tabs defaultValue="error">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="error">Error</TabsTrigger>
                      <TabsTrigger value="payload">Payload</TabsTrigger>
                      <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="error" className="space-y-2">
                      <div className="text-sm">
                        <div className="font-medium text-red-600 mb-1">Error Message:</div>
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          {selectedError.errorMessage}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-1">Stack Trace:</div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                          {selectedError.stackTrace}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payload">
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(selectedError.payload, null, 2)}
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="logs">
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {selectedError.logs.map((log, index) => (
                            <div
                              key={index}
                              className={`text-xs p-2 rounded font-mono ${
                                log.level === "error" ? "bg-red-50 text-red-700" :
                                log.level === "warn" ? "bg-yellow-50 text-yellow-700" :
                                log.level === "debug" ? "bg-blue-50 text-blue-700" :
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              [{log.timestamp}] [{log.level.toUpperCase()}] [{log.actor}@{log.module}] {log.message}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="simulate" className="space-y-4">
            {/* Action Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Replayable Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action to simulate..." />
                </SelectTrigger>
                <SelectContent>
                  {replayableActions.map(action => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.name} ({action.module})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payload Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Payload (JSON)</label>
                <Button size="sm" variant="outline" onClick={loadSamplePayload} disabled={!selectedAction}>
                  Load Sample
                </Button>
              </div>
              <Textarea
                placeholder="Enter JSON payload for the action..."
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="font-mono text-sm min-h-24"
              />
            </div>

            {/* Create Error */}
            <Button 
              onClick={createTestError}
              disabled={!selectedAction}
              className="w-full"
            >
              Create Simulated Error
            </Button>

            {/* Available Actions Info */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Available Actions:</h4>
                <div className="space-y-2 text-sm">
                  {replayableActions.map(action => (
                    <div key={action.id} className="flex justify-between">
                      <span>{action.name}</span>
                      <Badge variant="outline" className="text-xs">{action.module}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}