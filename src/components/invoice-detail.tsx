import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ArrowLeft, FileText, Download, Eye, Shield, ExternalLink, Receipt } from "@phosphor-icons/react";
import { Invoice, UserRole, InvoiceNote } from "@/lib/types";
import { invoiceService } from "@/lib/invoice-service";
import { logEvent, stamp } from "@/lib/build-log";

const tag = stamp('V17.1.3', 'invoice-detail');

interface InvoiceDetailProps {
  invoice: Invoice;
  userRole: UserRole;
  onBack: () => void;
}

export function InvoiceDetail({ invoice, userRole, onBack }: InvoiceDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");

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

  const getStatusBadgeVariant = (status: Invoice["status"]) => {
    switch (status) {
      case "Draft": return "secondary";
      case "Issued": return "default";
      case "Paid": return "success" as any;
      case "Void": return "destructive";
      default: return "secondary";
    }
  };

  const handleExport = async (format: "PDF" | "Excel" | "CSV") => {
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
      
      tag('invoice_exported', { 
        invoiceId: invoice.id, 
        format, 
        userRole 
      });
    } catch (error) {
      tag('export_failed', { 
        invoiceId: invoice.id, 
        format, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const handleExportParityCheck = async () => {
    try {
      const results = await invoiceService.validateExportParity(invoice.id, "system");
      const allMatch = results.every(r => r.totalsMatch);
      const message = allMatch 
        ? "All export formats have matching totals" 
        : "Export format discrepancies detected";
      
      tag('export_parity_checked', { 
        invoiceId: invoice.id, 
        allMatch, 
        resultsCount: results.length 
      });
      alert(message); // In production, use a proper toast/notification system
    } catch (error) {
      tag('export_parity_failed', { 
        invoiceId: invoice.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  // Mock GL Journal data (in real app, would fetch from API)
  const getGLJournalData = () => {
    if (!invoice.glJournalId) return null;
    
    return {
      journalId: invoice.glJournalId,
      postedAt: invoice.issuedDate + 'T10:00:00Z',
      postedBy: 'system',
      entries: [
        {
          account: '1200',
          accountName: 'Accounts Receivable',
          debit: invoice.grandTotal,
          credit: 0,
          memo: `Invoice ${invoice.invoiceNumber} - ${invoice.client.name}`
        },
        {
          account: '4000',
          accountName: 'Revenue',
          debit: 0,
          credit: invoice.grandTotal,
          memo: `Invoice ${invoice.invoiceNumber} - ${invoice.client.name}`
        }
      ]
    };
  };

  const renderGLJournalDrawer = () => {
    const journalData = getGLJournalData();
    if (!journalData) return null;

    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View GL Journal
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>GL Journal Entry - {journalData.journalId}</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Posted At:</span>
                <span className="ml-2">{formatDate(journalData.postedAt)}</span>
              </div>
              <div>
                <span className="font-medium">Posted By:</span>
                <span className="ml-2">{journalData.postedBy}</span>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Memo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalData.entries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{entry.account}</TableCell>
                    <TableCell>{entry.accountName}</TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.memo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-between pt-4 border-t">
              <span className="font-medium">Totals:</span>
              <div className="space-x-4">
                <span>Debits: {formatCurrency(journalData.entries.reduce((sum, e) => sum + e.debit, 0))}</span>
                <span>Credits: {formatCurrency(journalData.entries.reduce((sum, e) => sum + e.credit, 0))}</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  const canModify = userRole === "Finance" || userRole === "Admin";
  const isVendorReadOnly = userRole === "Vendor";
  const canViewInternalNotes = userRole !== "Vendor";

  const getVisibleNotes = (notes: InvoiceNote[]) => {
    if (canViewInternalNotes) {
      return notes;
    }
    return notes.filter(note => note.type === "vendor");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">{invoice.clientName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-sm">
            {invoice.status}
          </Badge>
          
          {isVendorReadOnly && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Read Only
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-mono">{invoice.invoiceNumber}</span>
                  
                  <span className="text-muted-foreground">Client:</span>
                  <span>{invoice.clientName}</span>
                  
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="w-fit">
                    {invoice.status}
                  </Badge>
                  
                  <span className="text-muted-foreground">Issued:</span>
                  <span>{formatDate(invoice.issuedDate)}</span>
                  
                  <span className="text-muted-foreground">Due:</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Totals Block */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice Totals
                  {invoice.glJournalId && (
                    <Badge variant="outline" className="text-xs">
                      GL Posted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Before Discounts:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discounts:</span>
                      <span className="text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Discounts:</span>
                    <span>{formatCurrency(invoice.afterDiscounts)}</span>
                  </div>
                  
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes:</span>
                      <span>{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Grand Total:</span>
                    <span className="text-lg">{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                  
                  {invoice.glJournalId && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">GL Journal ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{invoice.glJournalId}</span>
                          {renderGLJournalDrawer()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExport("PDF")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExport("Excel")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleExport("CSV")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={handleExportParityCheck}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Check Export Parity
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Notes</CardTitle>
              {!canViewInternalNotes && (
                <p className="text-sm text-muted-foreground">
                  Only vendor-visible notes are shown
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {getVisibleNotes(invoice.notes).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notes available
                </div>
              ) : (
                <div className="space-y-4">
                  {getVisibleNotes(invoice.notes).map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={note.type === "internal" ? "destructive" : "secondary"}>
                            {note.type === "internal" ? "Internal" : "Vendor"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {note.createdBy}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {canModify && (
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-medium">Add Note</label>
                  <Textarea
                    placeholder="Enter note content..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Add Internal Note
                    </Button>
                    <Button variant="default" size="sm">
                      Add Vendor Note
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and download invoice in various formats
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-center space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-red-500" />
                    <h3 className="font-medium">PDF Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Professional formatted document
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleExport("PDF")}
                    >
                      Download PDF
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center space-y-3">
                    <Download className="h-8 w-8 mx-auto text-green-500" />
                    <h3 className="font-medium">Excel Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Spreadsheet with calculations
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleExport("Excel")}
                    >
                      Download Excel
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-center space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-blue-500" />
                    <h3 className="font-medium">CSV Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Raw data for integration
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleExport("CSV")}
                    >
                      Download CSV
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleExportParityCheck}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Validate Export Parity
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ensures totals match across all export formats
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}