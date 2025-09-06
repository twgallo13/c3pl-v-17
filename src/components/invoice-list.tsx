import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Download } from "@phosphor-icons/react";
import { Invoice, UserRole } from "@/lib/types";
import { invoiceService } from "@/lib/invoice-service";
import { logEvent } from "@/lib/build-log";

interface InvoiceListProps {
  userRole: UserRole;
  vendorId?: string;
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceList({ userRole, vendorId, onSelectInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [userRole, vendorId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceService.getInvoices(userRole, vendorId);
      setInvoices(invoiceData);
      logEvent("info", "Invoice List", "system", `Loaded ${invoiceData.length} invoices for role: ${userRole}`);
    } catch (error) {
      logEvent("error", "Invoice List", "system", `Failed to load invoices: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: Invoice["status"]) => {
    switch (status) {
      case "Draft": return "secondary";
      case "Issued": return "default";
      case "Paid": return "success" as any;
      case "Void": return "destructive";
      default: return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const handleExport = async (invoice: Invoice, format: "PDF" | "Excel" | "CSV") => {
    try {
      const blob = await invoiceService.exportInvoice(invoice.id, format, "system");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      logEvent("info", "Invoice List", "system", `Exported invoice ${invoice.invoiceNumber} as ${format}`);
    } catch (error) {
      logEvent("error", "Invoice List", "system", `Failed to export invoice: ${error}`);
    }
  };

  const canModify = userRole === "Finance" || userRole === "Admin";
  const isVendorReadOnly = userRole === "Vendor";

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading invoices...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Invoice List</span>
          <Badge variant="outline" className="font-mono">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        {isVendorReadOnly && (
          <div className="text-sm text-muted-foreground">
            Read-only access - Contact Finance for modifications
          </div>
        )}
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invoices found for your role
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.totals.grandTotal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectInvoice(invoice)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(invoice, "PDF")}
                            className="h-8 w-8 p-0"
                            title="Export PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(invoice, "Excel")}
                            className="h-8 w-8 p-0"
                            title="Export Excel"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(invoice, "CSV")}
                            className="h-8 w-8 p-0"
                            title="Export CSV"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}