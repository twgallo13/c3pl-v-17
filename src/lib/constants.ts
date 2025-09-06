import { QAUser, UserRole, LogEntry } from "./types";

export const APP_VERSION = "V17.1.2";

export const QA_USER: QAUser = {
  id: "qa-user-001",
  username: "qa_tester",
  email: "qa@c3pl.dev",
  role: "Admin"
};

export const USER_ROLES: UserRole[] = [
  "Vendor",
  "Account Manager", 
  "Customer Service",
  "Operations",
  "Admin",
  "Finance",
  "Associate",
  "Manager"
];

export function createLogEntry(
  level: LogEntry["level"],
  message: string,
  actor: string,
  module: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    actor,
    module
  };
}

export function formatLogEntry(log: LogEntry): string {
  return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.actor}@${log.module}] ${log.message}`;
}