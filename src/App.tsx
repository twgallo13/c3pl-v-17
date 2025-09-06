import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VersionDisplay } from "@/components/version-display";
import { DebuggerPanel } from "@/components/debugger-panel";
import { TransitionReadinessChecklist } from "@/components/transition-checklist";
import { InvoiceList } from "@/components/invoice-list";
import { InvoiceDetail } from "@/components/invoice-detail";
import { ReceivingScreen } from "@/components/receiving-screen";
import { WaveControlDashboard } from "@/components/wave-control-dashboard";
import { PickingApp } from "@/components/picking-app";
import { PackoutStation } from "@/components/packout-station";
import RMAIntakeScreen from "@/components/rma-intake";
import RMAManagerConsole from "@/components/rma-manager-console";
import RMAFinanceView from "@/components/rma-finance-view";
import VendorPortalRMA from "@/components/vendor-portal-rma";
import { FinanceDashboard } from "@/components/finance-dashboard";
import { RMAAdjustmentsView } from "@/components/rma-adjustments-view";
import { PaymentsConsole } from "@/components/payments-console";
import { ErrorBoundary } from "@/components/error-boundary";
import { useKV } from "@github/spark/hooks";
import { UserRole, Invoice } from "@/lib/types";
import { useState } from "react";
import { Receipt, ArrowLeft, Package, Waves, Scan, Truck, RotateCcw, ClipboardList, DollarSign, Eye, TrendingUp, Calculator } from "@phosphor-icons/react";
import "@/lib/build-log";

function App() {
  const [currentRole] = useKV<UserRole>("c3pl-current-role", "Admin");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "invoices" | "finance-dashboard" | "rma-adjustments" | "payments-console" | "receiving" | "wave-control" | "picking" | "packout" | "rma-intake" | "rma-manager" | "rma-finance" | "vendor-portal-rma">("dashboard");
  
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
    <ErrorBoundary actor={`user-${currentRole}`} module="app">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(currentView !== "dashboard") && (
                <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-foreground">C3PL</h1>
                <p className="text-muted-foreground">Returns Management & Financial Operations Tool</p>
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
                      <span className="ml-2 font-mono">V17.1.4</span>
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

                <div className="space-y-2">
                  <Button 
                    onClick={() => setCurrentView("invoices")}
                    className="w-full"
                    variant="outline"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Financial Management
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("finance-dashboard")}
                    className="w-full"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Finance Dashboard
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("payments-console")}
                    className="w-full"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payments Console
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("rma-adjustments")}
                    className="w-full"
                    variant="outline"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    RMA Adjustments
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("rma-intake")}
                    className="w-full"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    RMA Intake
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("rma-manager")}
                    className="w-full"
                    variant="outline"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    RMA Manager Console
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("rma-finance")}
                    className="w-full"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    RMA Finance View
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("vendor-portal-rma")}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vendor Portal RMA
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("receiving")}
                    className="w-full"
                    variant="outline"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Receiving Station
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("wave-control")}
                    className="w-full"
                    variant="outline"
                  >
                    <Waves className="h-4 w-4 mr-2" />
                    Wave Control
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("picking")}
                    className="w-full"
                    variant="outline"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Picking App
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentView("packout")}
                    className="w-full"
                    variant="outline"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Packout Station
                  </Button>
                </div>
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

        {/* Finance Views */}
        {currentView === "finance-dashboard" && (
          <FinanceDashboard
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "payments-console" && (
          <PaymentsConsole
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "rma-adjustments" && (
          <RMAAdjustmentsView
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {/* WMS Views */}
        {currentView === "receiving" && (
          <ReceivingScreen
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "wave-control" && (
          <WaveControlDashboard
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "picking" && (
          <PickingApp
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "packout" && (
          <PackoutStation
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {/* RMA Views */}
        {currentView === "rma-intake" && (
          <RMAIntakeScreen
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "rma-manager" && (
          <RMAManagerConsole
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "rma-finance" && (
          <RMAFinanceView
            userRole={currentRole}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === "vendor-portal-rma" && (
          <VendorPortalRMA
            userRole={currentRole}
            vendorId={vendorId}
            onBack={handleBackToDashboard}
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
          C3PL V17.1.4 - Payments Console: Payment Processing, Bank Reconciliation, AR Aging, Dunning Management
        </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;