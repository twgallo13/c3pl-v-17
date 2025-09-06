import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Terminal, Settings, Check, Network, FileText, Bug, Receipt, Waves, RotateCcw } from "@phosphor-icons/react";
import { useKV } from "@github/spark/hooks";
import { useState } from "react";
import { VERSION, UserRole, QAUser, LogEntry } from "@/lib/types";
import { QA_USER, USER_ROLES, createLogEntry, formatLogEntry } from "@/lib/constants";
import { VersionDisplay } from "./version-display";
import { NetworkInspector } from "./network-inspector";
import { SchemaValidator } from "./schema-validator";
import { ErrorReplayer } from "./error-replayer";
import { ExportParityChecker } from "./export-parity-checker";
import { WMSAuditExplorer } from "./wms-audit-explorer";
import { WaveSimulationTool } from "./wave-simulation-tool";
import { RMAEventStream } from "./rma-event-stream";
import { DispositionSimulator } from "./disposition-simulator";

interface DebuggerPanelProps {
  className?: string;
}

export function DebuggerPanel({ className }: DebuggerPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useKV("c3pl-logged-in", false);
  const [currentUser, setCurrentUser] = useKV<QAUser | null>("c3pl-current-user", null);
  const [currentRole, setCurrentRole] = useKV<UserRole>("c3pl-current-role", "Admin");
  const [consoleEnabled, setConsoleEnabled] = useKV("c3pl-console-enabled", true);
  const [logs, setLogs] = useKV<LogEntry[]>("c3pl-logs", []);

  const addLog = (level: LogEntry["level"], message: string, module: string) => {
    const actor = currentUser?.username || "anonymous";
    const newLog = createLogEntry(level, message, actor, module);
    setLogs((currentLogs) => [...currentLogs.slice(-49), newLog]); // Keep last 50 logs
    
    if (consoleEnabled) {
      console.log(formatLogEntry(newLog));
    }
  };

  const handleQALogin = () => {
    try {
      setIsLoggedIn(true);
      setCurrentUser(QA_USER);
      setCurrentRole(QA_USER.role);
      addLog("info", "QA login successful", "auth");
    } catch (error) {
      addLog("error", `QA login failed: ${error}`, "auth");
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    try {
      setCurrentRole(newRole);
      addLog("info", `Role switched to ${newRole}`, "role-manager");
    } catch (error) {
      addLog("error", `Role switch failed: ${error}`, "role-manager");
    }
  };

  const handleConsoleToggle = (enabled: boolean) => {
    try {
      setConsoleEnabled(enabled);
      addLog("info", `Console output ${enabled ? "enabled" : "disabled"}`, "console");
    } catch (error) {
      addLog("error", `Console toggle failed: ${error}`, "console");
    }
  };

  const clearLogs = () => {
    try {
      setLogs([]);
      addLog("info", "Logs cleared", "console");
    } catch (error) {
      addLog("error", `Clear logs failed: ${error}`, "console");
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings size={20} />
            C3PL Debugger
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Active Version: {VERSION}
            </Badge>
            <VersionDisplay />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-9 text-xs">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="network">
              <Network size={14} className="mr-1" />
              Network
            </TabsTrigger>
            <TabsTrigger value="schema">
              <FileText size={14} className="mr-1" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt size={14} className="mr-1" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="rma-events">
              <RotateCcw size={14} className="mr-1" />
              RMA Events
            </TabsTrigger>
            <TabsTrigger value="rma-sim">
              RMA Sim
            </TabsTrigger>
            <TabsTrigger value="wms-audit">
              <Waves size={14} className="mr-1" />
              WMS Audit
            </TabsTrigger>
            <TabsTrigger value="wave-sim">
              Wave Sim
            </TabsTrigger>
            <TabsTrigger value="errors">
              <Bug size={14} className="mr-1" />
              Errors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-6">
            {/* QA Login Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Authentication</Label>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleQALogin}
                  className="flex items-center gap-2"
                  disabled={isLoggedIn}
                >
                  {isLoggedIn ? <Check size={16} /> : <User size={16} />}
                  {isLoggedIn ? "Logged In" : "QA Login"}
                </Button>
                {isLoggedIn && currentUser && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {currentUser.username}
                  </Badge>
                )}
              </div>
            </div>

            {/* Role Switcher Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Role Switcher</Label>
              <Select value={currentRole} onValueChange={handleRoleSwitch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Console Toggle Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Console Output</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="console-toggle"
                  checked={consoleEnabled}
                  onCheckedChange={handleConsoleToggle}
                />
                <Label htmlFor="console-toggle" className="text-sm">
                  {consoleEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>

            {/* Console Output Display */}
            {consoleEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Terminal size={16} />
                    Structured Logs
                  </Label>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    Clear
                  </Button>
                </div>
                <ScrollArea className="h-48 w-full rounded border bg-muted/30 p-3">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="text-muted-foreground">No logs yet...</div>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className={`${
                            log.level === "error"
                              ? "text-destructive"
                              : log.level === "warn"
                              ? "text-yellow-600"
                              : log.level === "info"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatLogEntry(log)}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="network">
            <NetworkInspector />
          </TabsContent>

          <TabsContent value="schema">
            <SchemaValidator />
          </TabsContent>

          <TabsContent value="invoices">
            <ExportParityChecker />
          </TabsContent>

          <TabsContent value="rma-events">
            <RMAEventStream />
          </TabsContent>

          <TabsContent value="rma-sim">
            <DispositionSimulator />
          </TabsContent>

          <TabsContent value="wms-audit">
            <WMSAuditExplorer />
          </TabsContent>

          <TabsContent value="wave-sim">
            <WaveSimulationTool />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorReplayer />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}