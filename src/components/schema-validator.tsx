/**
 * Schema Validator Component for C3PL V17.0.1
 * Live validation of Firestore/API payloads against contracts
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertTriangle, FileText } from "@phosphor-icons/react";
import { validatePayload, getAvailableContracts, getContractInfo } from "@/lib/schema-validation";
import { SchemaValidationResult } from "@/lib/types";
import { useKV } from "@github/spark/hooks";
import { createLogEntry, formatLogEntry } from "@/lib/constants";

export function SchemaValidator() {
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [payloadText, setPayloadText] = useState("");
  const [validationResults, setValidationResults] = useKV<SchemaValidationResult[]>("c3pl-validation-results", []);
  const [currentResult, setCurrentResult] = useState<SchemaValidationResult | null>(null);

  const contracts = getAvailableContracts();

  const validateCurrentPayload = () => {
    if (!selectedContract) {
      console.warn(formatLogEntry(createLogEntry("warn", "No schema contract selected", "schema-validator", "schema-validator")));
      return;
    }

    if (!payloadText.trim()) {
      console.warn(formatLogEntry(createLogEntry("warn", "No payload provided for validation", "schema-validator", "schema-validator")));
      return;
    }

    try {
      const payload = JSON.parse(payloadText);
      const result = validatePayload(payload, selectedContract, "schema-validator");
      
      setCurrentResult(result);
      setValidationResults(current => [result, ...current.slice(0, 19)]); // Keep last 20 results
      
      console.log(formatLogEntry(createLogEntry("info", `Schema validation completed for ${selectedContract}`, "schema-validator", "schema-validator")));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON";
      const result: SchemaValidationResult = {
        isValid: false,
        errors: [`JSON Parse Error: ${errorMessage}`],
        warnings: [],
        module: "schema-validator",
        timestamp: new Date().toISOString(),
        actor: "schema-validator"
      };
      
      setCurrentResult(result);
      console.error(formatLogEntry(createLogEntry("error", `JSON parsing failed: ${errorMessage}`, "schema-validator", "schema-validator")));
    }
  };

  const loadSamplePayload = () => {
    if (!selectedContract) return;

    const samplePayloads: Record<string, any> = {
      "user-profile": {
        id: "user-123",
        username: "john_doe",
        email: "john@example.com",
        role: "Admin",
        firstName: "John",
        lastName: "Doe"
      },
      "api-request": {
        method: "POST",
        url: "https://api.example.com/users",
        timestamp: new Date().toISOString(),
        payload: { name: "Test User" },
        headers: { "Content-Type": "application/json" }
      },
      "firestore-document": {
        id: "doc-456",
        collection: "users",
        data: { name: "Test User", active: true },
        createdAt: new Date().toISOString(),
        version: 1
      },
      "invoice-schema": {
        id: "inv-001",
        invoiceNumber: "INV-2024-001",
        clientId: "client-001",
        clientName: "Acme Corporation",
        status: "Issued",
        issuedDate: "2024-01-15",
        dueDate: "2024-02-15",
        lineItems: [
          {
            id: "line-001",
            description: "Professional Services",
            quantity: 1,
            unitPrice: 10000,
            amount: 10000
          }
        ],
        totals: {
          subtotal: 10000,
          discounts: 500,
          taxes: 950,
          grandTotal: 10450
        },
        notes: [
          {
            id: "note-001",
            type: "vendor",
            content: "Standard payment terms apply",
            createdAt: "2024-01-15T10:00:00Z",
            createdBy: "vendor-001"
          }
        ],
        vendorId: "vendor-001",
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        createdBy: "system",
        updatedBy: "admin-001"
      },
      "invoice-line-item": {
        id: "line-001",
        description: "Professional Services Q1",
        quantity: 1,
        unitPrice: 10000,
        amount: 10000
      },
      "invoice-totals": {
        subtotal: 10000,
        discounts: 500,
        taxes: 950,
        grandTotal: 10450
      },
      "invoice-note": {
        id: "note-001",
        type: "vendor",
        content: "Payment terms: Net 30 days",
        createdAt: "2024-01-15T10:00:00Z",
        createdBy: "vendor-001"
      }
    };

    const sample = samplePayloads[selectedContract];
    if (sample) {
      setPayloadText(JSON.stringify(sample, null, 2));
      console.log(formatLogEntry(createLogEntry("info", `Sample payload loaded for ${selectedContract}`, "schema-validator", "schema-validator")));
    }
  };

  const loadInvalidSample = () => {
    if (!selectedContract) return;

    const invalidSamples: Record<string, any> = {
      "user-profile": {
        // Missing required fields: id, username, email
        role: "InvalidRole",
        email: "invalid-email"
      },
      "api-request": {
        method: "INVALID_METHOD",
        url: "not-a-url",
        // Missing required timestamp
        timeout: "not-a-number"
      },
      "firestore-document": {
        id: 123, // Should be string
        collection: "",
        // Missing required data field
        version: "not-a-number"
      },
      "invoice-schema": {
        id: 123, // Should be string
        invoiceNumber: "INVALID-FORMAT", // Should match INV-YYYY-NNN pattern
        clientId: "client-001",
        clientName: "Acme Corporation",
        status: "InvalidStatus", // Should be Draft|Issued|Paid|Void
        dueDate: "invalid-date",
        lineItems: [], // Should not be empty
        totals: {
          subtotal: "not-a-number", // Should be number
          discounts: -100, // Should be >= 0
          taxes: "invalid",
          grandTotal: -500
        },
        notes: "not-an-array", // Should be array
        createdAt: "invalid-date",
        updatedAt: "invalid-date",
        createdBy: "",
        updatedBy: ""
      },
      "invoice-line-item": {
        id: 123, // Should be string
        description: "",
        quantity: -1, // Should be > 0
        unitPrice: "not-a-number",
        amount: -100
      },
      "invoice-totals": {
        subtotal: -100, // Should be >= 0
        discounts: "invalid",
        taxes: -50,
        grandTotal: "not-a-number"
      },
      "invoice-note": {
        id: 123, // Should be string
        type: "invalid-type", // Should be vendor|internal
        content: "",
        createdAt: "invalid-date",
        createdBy: ""
      }
    };

    const sample = invalidSamples[selectedContract];
    if (sample) {
      setPayloadText(JSON.stringify(sample, null, 2));
      console.log(formatLogEntry(createLogEntry("info", `Invalid sample payload loaded for ${selectedContract}`, "schema-validator", "schema-validator")));
    }
  };

  const clearResults = () => {
    setValidationResults([]);
    setCurrentResult(null);
    console.log(formatLogEntry(createLogEntry("info", "Validation results cleared", "schema-validator", "schema-validator")));
  };

  const contractInfo = selectedContract ? getContractInfo(selectedContract) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Schema Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Schema Contract</label>
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger>
              <SelectValue placeholder="Select a schema contract..." />
            </SelectTrigger>
            <SelectContent>
              {contracts.map(contract => (
                <SelectItem key={contract} value={contract}>
                  {contract}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contract Info */}
        {contractInfo && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {contractInfo.name}
                </div>
                <div>
                  <span className="font-medium">Module:</span> {contractInfo.module}
                </div>
                <div>
                  <span className="font-medium">Required Fields:</span> {contractInfo.required.join(", ")}
                </div>
                {contractInfo.optional && (
                  <div>
                    <span className="font-medium">Optional Fields:</span> {contractInfo.optional.join(", ")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payload Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Payload (JSON)</label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadSamplePayload} disabled={!selectedContract}>
                Load Valid Sample
              </Button>
              <Button size="sm" variant="outline" onClick={loadInvalidSample} disabled={!selectedContract}>
                Load Invalid Sample
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Enter JSON payload to validate..."
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="font-mono text-sm min-h-32"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={validateCurrentPayload} disabled={!selectedContract || !payloadText.trim()}>
            Validate Payload
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>

        {/* Current Result */}
        {currentResult && (
          <Card className={`border-2 ${
            currentResult.isValid 
              ? currentResult.warnings.length > 0 
                ? "border-yellow-500/50 bg-yellow-50/50" 
                : "border-green-500/50 bg-green-50/50"
              : "border-red-500/50 bg-red-50/50"
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                {currentResult.isValid ? (
                  currentResult.warnings.length > 0 ? (
                    <AlertTriangle className="text-yellow-600" size={20} />
                  ) : (
                    <CheckCircle className="text-green-600" size={20} />
                  )
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={currentResult.isValid ? "default" : "destructive"}>
                    {currentResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentResult.timestamp}
                  </span>
                </div>
              </div>

              {currentResult.errors.length > 0 && (
                <div className="space-y-1 mb-3">
                  <h4 className="font-medium text-red-700">Errors:</h4>
                  {currentResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {currentResult.warnings.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-yellow-700">Warnings:</h4>
                  {currentResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation History */}
        {validationResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validation History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {validationResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                      onClick={() => setCurrentResult(result)}
                    >
                      <div className="flex items-center gap-2">
                        {result.isValid ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <XCircle className="text-red-600" size={16} />
                        )}
                        <span className="text-sm">{result.module}</span>
                        {result.warnings.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {result.warnings.length} warnings
                          </Badge>
                        )}
                        {result.errors.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {result.errors.length} errors
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}