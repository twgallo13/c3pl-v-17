export const VERSION = "V17.0.1" as const;

export type UserRole = "Vendor" | "Account Manager" | "Customer Service" | "Operations" | "Admin";

export interface QAUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  actor: string;
  module: string;
}

export interface NetworkRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  payload: any;
  response: any;
  responseTime: number;
  statusCode: number;
  errorCode?: string;
  actor: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  module: string;
  timestamp: string;
  actor: string;
}

export interface ErrorReplayData {
  id: string;
  timestamp: string;
  action: string;
  payload: any;
  errorMessage: string;
  stackTrace: string;
  actor: string;
  module: string;
  logs: LogEntry[];
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: QAUser | null;
  currentRole: UserRole;
  consoleEnabled: boolean;
  logs: LogEntry[];
  networkRequests: NetworkRequest[];
  lastError: ErrorReplayData | null;
}