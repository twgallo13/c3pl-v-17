/**
 * Schema Validation Utilities for C3PL V17.0.1
 * Live validation of Firestore/API payloads against contracts
 */

import { SchemaValidationResult } from "./types";
import { createLogEntry, formatLogEntry } from "./constants";

export interface SchemaContract {
  name: string;
  module: string;
  required: string[];
  optional?: string[];
  types: Record<string, string>;
  validation?: Record<string, (value: any) => boolean>;
}

// Sample schema contracts for validation
export const SCHEMA_CONTRACTS: Record<string, SchemaContract> = {
  "user-profile": {
    name: "User Profile",
    module: "user-management",
    required: ["id", "username", "email", "role"],
    optional: ["firstName", "lastName", "avatar"],
    types: {
      id: "string",
      username: "string", 
      email: "string",
      role: "string",
      firstName: "string",
      lastName: "string",
      avatar: "string"
    },
    validation: {
      email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      role: (value: string) => ["Vendor", "Account Manager", "Customer Service", "Operations", "Admin"].includes(value)
    }
  },
  "api-request": {
    name: "API Request",
    module: "network",
    required: ["method", "url", "timestamp"],
    optional: ["payload", "headers", "timeout"],
    types: {
      method: "string",
      url: "string",
      timestamp: "string",
      payload: "object",
      headers: "object",
      timeout: "number"
    },
    validation: {
      method: (value: string) => ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(value.toUpperCase()),
      url: (value: string) => /^https?:\/\/.+/.test(value)
    }
  },
  "firestore-document": {
    name: "Firestore Document",
    module: "firestore",
    required: ["id", "collection", "data"],
    optional: ["createdAt", "updatedAt", "version"],
    types: {
      id: "string",
      collection: "string",
      data: "object",
      createdAt: "string",
      updatedAt: "string",
      version: "number"
    }
  }
};

export function validatePayload(
  payload: any,
  contractName: string,
  actor: string
): SchemaValidationResult {
  const contract = SCHEMA_CONTRACTS[contractName];
  
  if (!contract) {
    const errorMsg = `Schema contract '${contractName}' not found`;
    console.warn(formatLogEntry(createLogEntry("warn", errorMsg, actor, "schema-validator")));
    
    return {
      isValid: false,
      errors: [errorMsg],
      warnings: [],
      module: "schema-validator",
      timestamp: new Date().toISOString(),
      actor
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of contract.required) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check field types and validation
  Object.keys(payload).forEach(key => {
    const expectedType = contract.types[key];
    const value = payload[key];

    if (expectedType) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      
      if (expectedType !== actualType && !(expectedType === "object" && actualType === "object")) {
        errors.push(`Field '${key}' expected ${expectedType}, got ${actualType}`);
      }

      // Run custom validation if available
      const validator = contract.validation?.[key];
      if (validator && !validator(value)) {
        errors.push(`Field '${key}' failed validation`);
      }
    } else if (!contract.optional?.includes(key) && !contract.required.includes(key)) {
      warnings.push(`Unexpected field: ${key}`);
    }
  });

  const isValid = errors.length === 0;
  const logLevel = isValid ? (warnings.length > 0 ? "warn" : "info") : "error";
  const message = isValid 
    ? `Schema validation passed for ${contract.name}${warnings.length > 0 ? ` with ${warnings.length} warnings` : ""}`
    : `Schema validation failed for ${contract.name} with ${errors.length} errors`;

  console.log(formatLogEntry(createLogEntry(logLevel, message, actor, contract.module)));
  
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      console.warn(formatLogEntry(createLogEntry("warn", `Schema Warning: ${warning}`, actor, contract.module)));
    });
  }

  if (errors.length > 0) {
    errors.forEach(error => {
      console.error(formatLogEntry(createLogEntry("error", `Schema Error: ${error}`, actor, contract.module)));
    });
  }

  return {
    isValid,
    errors,
    warnings,
    module: contract.module,
    timestamp: new Date().toISOString(),
    actor
  };
}

export function getAvailableContracts(): string[] {
  return Object.keys(SCHEMA_CONTRACTS);
}

export function getContractInfo(contractName: string): SchemaContract | null {
  return SCHEMA_CONTRACTS[contractName] || null;
}