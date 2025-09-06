import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VersionDisplay } from "@/components/version-display";
import { DebuggerPanel } from "@/components/debugger-panel";
import { TransitionReadinessChecklist } from "@/components/transition-checklist";
import { InvoiceList } from "@/components/invoice-list";
import { InvoiceDetail } from "@/components/invoice-detail";
import { useKV } from "@github/spark/hooks";
import { UserRole, Invoice } from "@/lib/types";
import { useState } from "react";
import { Receipt, ArrowLeft } from "@phosphor-icons/react";
import "@/lib/build-log";

function App() {
  const [currentRole] = useKV<UserRole>("c3pl-current-role", "Admin");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "invoices">("dashboard");
  
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedInvoice(null);
  };

  // In a real app, this would come from user authentication
  const vendorId = currentRole === "Vendor" ? "vendor-001" : undefined;
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView === "invoices" && (
              <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">C3PL</h1>
              <p className="text-muted-foreground">Quality Assurance & Financial Management Tool</p>
            </div>
          </div>
          <VersionDisplay />
        </header>

        {/* Main Content - Conditional Views */}
        {currentView === "dashboard" && !selectedInvoice && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application Shell */}
            <Card>
              <CardHeader>
                <CardTitle>Application Shell</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Role:</span>
                  <Badge variant="secondary">{currentRole}</Badge>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-medium mb-2">Role Permissions</h3>
                  <div className="text-sm text-muted-foreground">
                    {currentRole === "Admin" && "Full system access and configuration"}
                    {currentRole === "Finance" && "Financial operations and invoice management"}
                    {currentRole === "Operations" && "Operational controls and monitoring"}
                    {currentRole === "Customer Service" && "Customer support and ticket management"}
                    {currentRole === "Account Manager" && "Account oversight and client relations"}
                    {currentRole === "Vendor" && "Vendor-specific tools and data access"}
                  </div>
                </div>

                <div className="p-4 bg-card border rounded-lg">
                  <h3 className="font-medium mb-2">System Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Build:</span>
                      <span className="ml-2 font-mono">V17.1.0</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Environment:</span>
                      <span className="ml-2">QA Testing</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 text-green-600">Ready</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mode:</span>
                      <span className="ml-2">Debug</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setCurrentView("invoices")}
                  className="w-full"
                  variant="outline"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
              </CardContent>
            </Card>

            {/* Debugger Panel */}
            <DebuggerPanel />

            {/* Transition Readiness */}
            <TransitionReadinessChecklist />
          </div>
        )}

        {/* Invoice Views */}
        {currentView === "invoices" && !selectedInvoice && (
          <InvoiceList
            userRole={currentRole}
            vendorId={vendorId}
            onSelectInvoice={handleSelectInvoice}
          />
        )}

        {selectedInvoice && (
          <InvoiceDetail
            invoice={selectedInvoice}
            userRole={currentRole}
            onBack={handleBackToList}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-6 border-t">
          C3PL V17.1.0 - Enhanced with Invoice System, Schema Validation, and Export Parity Tools
        </footer>
      </div>
    </div>
  );
}

export default App;