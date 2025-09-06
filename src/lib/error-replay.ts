/**
 * Error Replay Utilities for C3PL V17.0.1
 * Replay failed actions with attached logs for debugging
 */

import { ErrorReplayData, LogEntry } from "./types";
import { createLogEntry, formatLogEntry } from "./constants";

export interface ReplayableAction {
  id: string;
  name: string;
  module: string;
  execute: (payload: any, actor: string) => Promise<any>;
  validate?: (payload: any) => boolean;
}

// Registry of replayable actions
export const REPLAYABLE_ACTIONS: Record<string, ReplayableAction> = {
  "api-call": {
    id: "api-call",
    name: "API Call",
    module: "network",
    execute: async (payload: { url: string; method: string; data?: any }, actor: string) => {
      console.log(formatLogEntry(createLogEntry("info", `Replaying API call: ${payload.method} ${payload.url}`, actor, "error-replayer")));
      
      // Simulate API call - in real implementation, this would make actual requests
      const response = await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (payload.url.includes("error")) {
            reject(new Error("Simulated API error for testing"));
          } else {
            resolve({ status: 200, data: { success: true, timestamp: new Date().toISOString() } });
          }
        }, Math.random() * 1000 + 500);
      });

      return response;
    },
    validate: (payload: any) => {
      return payload && typeof payload.url === "string" && typeof payload.method === "string";
    }
  },
  "firestore-write": {
    id: "firestore-write",
    name: "Firestore Write",
    module: "firestore",
    execute: async (payload: { collection: string; document: string; data: any }, actor: string) => {
      console.log(formatLogEntry(createLogEntry("info", `Replaying Firestore write: ${payload.collection}/${payload.document}`, actor, "error-replayer")));
      
      // Simulate Firestore write
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (payload.collection === "error-test") {
            reject(new Error("Simulated Firestore permission error"));
          } else {
            resolve({ 
              id: payload.document,
              writeTime: new Date().toISOString(),
              success: true 
            });
          }
        }, Math.random() * 800 + 200);
      });
    },
    validate: (payload: any) => {
      return payload && 
             typeof payload.collection === "string" && 
             typeof payload.document === "string" && 
             payload.data !== undefined;
    }
  },
  "user-authentication": {
    id: "user-authentication",
    name: "User Authentication",
    module: "auth",
    execute: async (payload: { username: string; password: string }, actor: string) => {
      console.log(formatLogEntry(createLogEntry("info", `Replaying authentication: ${payload.username}`, actor, "error-replayer")));
      
      // Simulate authentication
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (payload.username === "error-user") {
            reject(new Error("Invalid credentials"));
          } else {
            resolve({
              user: { id: "123", username: payload.username, role: "Admin" },
              token: "fake-jwt-token",
              expiresAt: new Date(Date.now() + 3600000).toISOString()
            });
          }
        }, Math.random() * 600 + 300);
      });
    },
    validate: (payload: any) => {
      return payload && 
             typeof payload.username === "string" && 
             typeof payload.password === "string";
    }
  }
};

export function captureError(
  action: string,
  payload: any,
  error: Error,
  actor: string,
  module: string,
  logs: LogEntry[]
): ErrorReplayData {
  const errorData: ErrorReplayData = {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    payload,
    errorMessage: error.message,
    stackTrace: error.stack || "No stack trace available",
    actor,
    module,
    logs: [...logs] // Copy logs at time of error
  };

  // Log the error capture
  console.error(formatLogEntry(createLogEntry("error", `Error captured for replay: ${action} - ${error.message}`, actor, module)));
  
  return errorData;
}

export async function replayError(
  errorData: ErrorReplayData,
  actor: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  const action = REPLAYABLE_ACTIONS[errorData.action];
  
  if (!action) {
    const errorMsg = `Action '${errorData.action}' is not replayable`;
    console.error(formatLogEntry(createLogEntry("error", errorMsg, actor, "error-replayer")));
    return { success: false, error: errorMsg };
  }

  // Validate payload if validator exists
  if (action.validate && !action.validate(errorData.payload)) {
    const errorMsg = `Invalid payload for action '${errorData.action}'`;
    console.error(formatLogEntry(createLogEntry("error", errorMsg, actor, "error-replayer")));
    return { success: false, error: errorMsg };
  }

  try {
    console.log(formatLogEntry(createLogEntry("info", `Starting error replay: ${errorData.id}`, actor, "error-replayer")));
    
    // Replay the original logs for context
    console.group(`📋 Original logs from ${errorData.timestamp}:`);
    errorData.logs.forEach(log => {
      const logFunc = log.level === "error" ? console.error : 
                    log.level === "warn" ? console.warn : 
                    log.level === "debug" ? console.debug : console.log;
      logFunc(formatLogEntry(log));
    });
    console.groupEnd();

    // Execute the action
    const result = await action.execute(errorData.payload, actor);
    
    console.log(formatLogEntry(createLogEntry("info", `Error replay successful: ${errorData.id}`, actor, "error-replayer")));
    return { success: true, result };
    
  } catch (replayError) {
    const errorMsg = `Error replay failed: ${replayError instanceof Error ? replayError.message : String(replayError)}`;
    console.error(formatLogEntry(createLogEntry("error", errorMsg, actor, "error-replayer")));
    return { success: false, error: errorMsg };
  }
}

export function getReplayableActions(): ReplayableAction[] {
  return Object.values(REPLAYABLE_ACTIONS);
}

export function createSimulatedError(
  actionId: string,
  payload: any,
  actor: string
): ErrorReplayData {
  const action = REPLAYABLE_ACTIONS[actionId];
  const module = action?.module || "unknown";
  
  const simulatedError = new Error(`Simulated error for testing - Action: ${actionId}`);
  simulatedError.stack = `Error: Simulated error for testing
    at simulateError (error-replayer.ts:test)
    at executeAction (${module}.ts:${Math.floor(Math.random() * 100)})
    at processRequest (handler.ts:${Math.floor(Math.random() * 50)})`;

  const logs: LogEntry[] = [
    createLogEntry("info", `Starting ${actionId}`, actor, module),
    createLogEntry("debug", `Payload: ${JSON.stringify(payload)}`, actor, module),
    createLogEntry("warn", "Performance warning: slow response detected", actor, module),
    createLogEntry("error", simulatedError.message, actor, module)
  ];

  return captureError(actionId, payload, simulatedError, actor, module, logs);
}