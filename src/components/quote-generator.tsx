// V17.2.0 — Quote Generator (5-Step Wizard)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, Plus, Minus, Calculator, 
  Download, FileText, Eye, Trash, CheckCircle, XCircle 
} from '@phosphor-icons/react';
import { UserRole, QuoteInput, QuoteResult, Lane } from '@/lib/types';
import { VersionDisplay } from '@/components/version-display';
import { quotePricingEngine, PricingContext } from '@/services/quote-pricing';
import { quoteExportService, ExportResult } from '@/lib/exports/quote';
import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.2.0', 'quoting');

interface QuoteGeneratorProps {
  userRole: UserRole;
  onBack: () => void;
}

type WizardStep = 'basics' | 'vas' | 'pricing' | 'comparison' | 'summary';

// Mock data for demo
const MOCK_VERSION_IDS = ['v2024Q4', 'v2025Q1', 'v2025Q2'];
const MOCK_VAS_OPTIONS = [
  { code: 'KITTING', name: 'Kitting Services', rate: 2.50, unit: 'per_unit' },
  { code: 'LABELING', name: 'Custom Labeling', rate: 0.75, unit: 'per_unit' },
  { code: 'PHOTOGRAPHY', name: 'Product Photography', rate: 15.00, unit: 'per_unit' },
  { code: 'QUALITY_CHECK', name: 'Quality Inspection', rate: 1.25, unit: 'per_unit' }
];

export function QuoteGenerator({ userRole, onBack }: QuoteGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [quoteInput, setQuoteInput] = useState<QuoteInput>({
    version_id: 'v2025Q1',
    lane: {
      origin: { country: 'US', state: '', zip3: '' },
      dest: { country: 'US', state: '', zip3: '' }
    },
    volumes: {
      units_received: undefined,
      orders_shipped: undefined
    },
    vas: [],
    surcharges: [],
    discounts: [],
    assumptions: {}
  });
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exports, setExports] = useState<ExportResult[]>([]);
  const [exportDigests, setExportDigests] = useState<Record<string, string>>({});

  // RBAC check - Sales/AM can create quotes, Admin can see all
  const canCreateQuotes = ['Admin', 'Account Manager'].includes(userRole);
  const isVendorReadOnly = userRole === 'Vendor';

  useEffect(() => {
    if (currentStep === 'summary' && !quoteResult) {
      generateQuote();
    }
  }, [currentStep]);

  const generateQuote = async () => {
    setIsGenerating(true);
    tag('quote_generation_requested', { step: currentStep, quoteInput });
    
    try {
      // Mock pricing context - in reality this would come from Firestore
      const context: PricingContext = {
        benchmarkRates: [
          {
            version_id: quoteInput.version_id,
            mode: 'receiving',
            service_level: 'standard',
            origin_country: 'US',
            dest_country: 'US',
            effective_start_date: '2024-01-01',
            effective_end_date: '2025-12-31',
            weight_min_kg: 0,
            weight_max_kg: 999999,
            volume_min_cbm: 0,
            volume_max_cbm: 999999,
            unit: 'per_unit',
            rate_benchmark: 1.25,
            currency: 'USD',
            source_tag: 'demo',
            confidence: 0.95
          },
          {
            version_id: quoteInput.version_id,
            mode: 'fulfillment',
            service_level: 'pick_pack',
            origin_country: 'US',
            dest_country: 'US',
            effective_start_date: '2024-01-01',
            effective_end_date: '2025-12-31',
            weight_min_kg: 0,
            weight_max_kg: 999999,
            volume_min_cbm: 0,
            volume_max_cbm: 999999,
            unit: 'per_order',
            rate_benchmark: 3.75,
            currency: 'USD',
            source_tag: 'demo',
            confidence: 0.92
          },
          {
            version_id: quoteInput.version_id,
            mode: 'storage',
            service_level: 'standard',
            origin_country: 'US',
            dest_country: 'US',
            effective_start_date: '2024-01-01',
            effective_end_date: '2025-12-31',
            weight_min_kg: 0,
            weight_max_kg: 999999,
            volume_min_cbm: 0,
            volume_max_cbm: 999999,
            unit: 'per_month',
            rate_benchmark: 45.00,
            currency: 'USD',
            source_tag: 'demo',
            confidence: 0.88
          }
        ],
        valueAddedOptions: MOCK_VAS_OPTIONS.map(vas => ({
          version_id: quoteInput.version_id,
          code: vas.code,
          name: vas.name,
          pricing_type: 'fixed',
          unit: vas.unit,
          default_rate: vas.rate,
          currency: 'USD',
          category: 'VAS',
          source_tag: 'demo',
          confidence: 0.90
        })),
        version_id: quoteInput.version_id
      };

      const result = await quotePricingEngine.generateQuote(quoteInput, context);
      setQuoteResult(result);
    } catch (error) {
      tag('quote_generation_failed', { error: error.message });
      alert(`Failed to generate quote: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'PDF' | 'CSV' | 'XLSX') => {
    if (!quoteResult) return;

    try {
      let exportResult: ExportResult;
      
      switch (format) {
        case 'PDF':
          exportResult = await quoteExportService.exportPDF(quoteResult, quoteInput);
          break;
        case 'CSV':
          exportResult = await quoteExportService.exportCSV(quoteResult, quoteInput);
          break;
        case 'XLSX':
          exportResult = await quoteExportService.exportXLSX(quoteResult, quoteInput);
          break;
      }

      // Store digest
      setExportDigests(prev => ({ ...prev, [format]: exportResult.digest }));
      setExports(prev => [...prev.filter(e => e.format !== format), exportResult]);

      // Download file
      const filename = `quote_${quoteInput.version_id}_${Date.now()}.${format.toLowerCase()}`;
      quoteExportService.downloadFile(exportResult.data, filename, format);

      tag('quote_exported', { format, digest: exportResult.digest });
    } catch (error) {
      tag('quote_export_failed', { format, error: error.message });
      alert(`Export failed: ${error.message}`);
    }
  };

  const handleAddVAS = () => {
    setQuoteInput(prev => ({
      ...prev,
      vas: [...(prev.vas || []), { code: '', qty: 1 }]
    }));
  };

  const handleRemoveVAS = (index: number) => {
    setQuoteInput(prev => ({
      ...prev,
      vas: prev.vas?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddDiscount = () => {
    setQuoteInput(prev => ({
      ...prev,
      discounts: [...(prev.discounts || []), { code: 'DISCOUNT_1', basis: 'percent', value: 0, apply_to: 'all' }]
    }));
  };

  const handleRemoveDiscount = (index: number) => {
    setQuoteInput(prev => ({
      ...prev,
      discounts: prev.discounts?.filter((_, i) => i !== index) || []
    }));
  };

  const getStepNumber = (step: WizardStep): number => {
    const steps: WizardStep[] = ['basics', 'vas', 'pricing', 'comparison', 'summary'];
    return steps.indexOf(step) + 1;
  };

  const goToNextStep = () => {
    const steps: WizardStep[] = ['basics', 'vas', 'pricing', 'comparison', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: WizardStep[] = ['basics', 'vas', 'pricing', 'comparison', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  if (!canCreateQuotes && !isVendorReadOnly) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Quote generation requires Sales or Account Manager role</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quote Generator</h1>
            <p className="text-muted-foreground">Create pricing quotes with benchmarks and comparisons</p>
          </div>
        </div>
        <VersionDisplay />
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Step {getStepNumber(currentStep)} of 5</span>
            <span className="text-sm text-muted-foreground capitalize">{currentStep.replace('_', ' ')}</span>
          </div>
          <Progress value={getStepNumber(currentStep) * 20} className="w-full" />
        </CardContent>
      </Card>

      {/* Step 1: Basics */}
      {currentStep === 'basics' && (
        <Card>
          <CardHeader>
            <CardTitle>Quote Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version-id">Benchmark Version</Label>
                <Select 
                  value={quoteInput.version_id} 
                  onValueChange={(value) => setQuoteInput(prev => ({ ...prev, version_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_VERSION_IDS.map(version => (
                      <SelectItem key={version} value={version}>{version}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client-name">Client Name</Label>
                <Input id="client-name" placeholder="Enter client name" />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Lane Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Origin</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Country</Label>
                      <Select 
                        value={quoteInput.lane.origin.country}
                        onValueChange={(value) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, origin: { ...prev.lane.origin, country: value } }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>State (Optional)</Label>
                      <Input 
                        value={quoteInput.lane.origin.state || ''}
                        onChange={(e) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, origin: { ...prev.lane.origin, state: e.target.value } }
                        }))}
                        placeholder="e.g., CA"
                      />
                    </div>
                    <div>
                      <Label>ZIP3 (Optional)</Label>
                      <Input 
                        value={quoteInput.lane.origin.zip3 || ''}
                        onChange={(e) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, origin: { ...prev.lane.origin, zip3: e.target.value } }
                        }))}
                        placeholder="e.g., 900"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Destination</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Country</Label>
                      <Select 
                        value={quoteInput.lane.dest.country}
                        onValueChange={(value) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, dest: { ...prev.lane.dest, country: value } }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>State (Optional)</Label>
                      <Input 
                        value={quoteInput.lane.dest.state || ''}
                        onChange={(e) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, dest: { ...prev.lane.dest, state: e.target.value } }
                        }))}
                        placeholder="e.g., NY"
                      />
                    </div>
                    <div>
                      <Label>ZIP3 (Optional)</Label>
                      <Input 
                        value={quoteInput.lane.dest.zip3 || ''}
                        onChange={(e) => setQuoteInput(prev => ({
                          ...prev,
                          lane: { ...prev.lane, dest: { ...prev.lane.dest, zip3: e.target.value } }
                        }))}
                        placeholder="e.g., 100"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Volume Assumptions</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Units Received (Monthly)</Label>
                  <Input 
                    type="number"
                    value={quoteInput.volumes.units_received || ''}
                    onChange={(e) => setQuoteInput(prev => ({
                      ...prev,
                      volumes: { ...prev.volumes, units_received: Number(e.target.value) || undefined }
                    }))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label>Orders Shipped (Monthly)</Label>
                  <Input 
                    type="number"
                    value={quoteInput.volumes.orders_shipped || ''}
                    onChange={(e) => setQuoteInput(prev => ({
                      ...prev,
                      volumes: { ...prev.volumes, orders_shipped: Number(e.target.value) || undefined }
                    }))}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label>Storage Duration (Months)</Label>
                  <Input 
                    type="number"
                    value={quoteInput.assumptions?.storage_months || ''}
                    onChange={(e) => setQuoteInput(prev => ({
                      ...prev,
                      assumptions: { ...prev.assumptions, storage_months: Number(e.target.value) || undefined }
                    }))}
                    placeholder="3"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={goToNextStep}>
                Next: VAS Selection
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: VAS */}
      {currentStep === 'vas' && (
        <Card>
          <CardHeader>
            <CardTitle>Value Added Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Select and configure value-added services</p>
              {!isVendorReadOnly && (
                <Button variant="outline" onClick={handleAddVAS}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add VAS
                </Button>
              )}
            </div>

            {quoteInput.vas && quoteInput.vas.length > 0 ? (
              <div className="space-y-3">
                {quoteInput.vas.map((vas, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>Service</Label>
                      <Select 
                        value={vas.code} 
                        onValueChange={(value) => {
                          const updated = [...quoteInput.vas!];
                          updated[index] = { ...updated[index], code: value };
                          setQuoteInput(prev => ({ ...prev, vas: updated }));
                        }}
                        disabled={isVendorReadOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_VAS_OPTIONS.map(option => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.name} (${option.rate}/{option.unit.replace('_', ' ')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-24">
                      <Label>Quantity</Label>
                      <Input 
                        type="number"
                        value={vas.qty}
                        onChange={(e) => {
                          const updated = [...quoteInput.vas!];
                          updated[index] = { ...updated[index], qty: Number(e.target.value) || 1 };
                          setQuoteInput(prev => ({ ...prev, vas: updated }));
                        }}
                        disabled={isVendorReadOnly}
                        min="1"
                      />
                    </div>
                    
                    {!isVendorReadOnly && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveVAS(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No value-added services selected
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={goToNextStep}>
                Next: Pricing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pricing Flex */}
      {currentStep === 'pricing' && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Flexibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Configure discounts and pricing adjustments</p>
              {!isVendorReadOnly && (
                <Button variant="outline" onClick={handleAddDiscount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount
                </Button>
              )}
            </div>

            {quoteInput.discounts && quoteInput.discounts.length > 0 ? (
              <div className="space-y-3">
                {quoteInput.discounts.map((discount, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={discount.basis} 
                          onValueChange={(value: 'flat' | 'percent') => {
                            const updated = [...quoteInput.discounts!];
                            updated[index] = { ...updated[index], basis: value };
                            setQuoteInput(prev => ({ ...prev, discounts: updated }));
                          }}
                          disabled={isVendorReadOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat Amount</SelectItem>
                            <SelectItem value="percent">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Value</Label>
                        <Input 
                          type="number"
                          value={discount.value}
                          onChange={(e) => {
                            const updated = [...quoteInput.discounts!];
                            updated[index] = { ...updated[index], value: Number(e.target.value) || 0 };
                            setQuoteInput(prev => ({ ...prev, discounts: updated }));
                          }}
                          disabled={isVendorReadOnly}
                          placeholder={discount.basis === 'flat' ? '50.00' : '10'}
                        />
                      </div>
                      
                      <div>
                        <Label>Apply To</Label>
                        <Select 
                          value={discount.apply_to} 
                          onValueChange={(value) => {
                            const updated = [...quoteInput.discounts!];
                            updated[index] = { ...updated[index], apply_to: value as any };
                            setQuoteInput(prev => ({ ...prev, discounts: updated }));
                          }}
                          disabled={isVendorReadOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="non_surcharges">Non-Surcharges</SelectItem>
                            <SelectItem value="category:Receiving">Receiving Only</SelectItem>
                            <SelectItem value="category:Fulfillment">Fulfillment Only</SelectItem>
                            <SelectItem value="category:Storage">Storage Only</SelectItem>
                            <SelectItem value="category:VAS">VAS Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Badge variant="secondary">
                          {discount.basis === 'flat' ? `$${discount.value}` : `${discount.value}%`}
                        </Badge>
                      </div>
                    </div>
                    
                    {!isVendorReadOnly && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDiscount(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No discounts configured
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={goToNextStep}>
                Next: Comparison
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Comparison */}
      {currentStep === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Optional: Add a competitor baseline for comparison</p>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Competitor Name</Label>
                <Input 
                  value={quoteInput.competitor_baseline?.label || ''}
                  onChange={(e) => setQuoteInput(prev => ({
                    ...prev,
                    competitor_baseline: prev.competitor_baseline 
                      ? { ...prev.competitor_baseline, label: e.target.value }
                      : { label: e.target.value, amount: 0, currency: 'USD' }
                  }))}
                  placeholder="e.g., Competitor X"
                  disabled={isVendorReadOnly}
                />
              </div>
              
              <div>
                <Label>Their Quote Amount</Label>
                <Input 
                  type="number"
                  value={quoteInput.competitor_baseline?.amount || ''}
                  onChange={(e) => setQuoteInput(prev => ({
                    ...prev,
                    competitor_baseline: prev.competitor_baseline 
                      ? { ...prev.competitor_baseline, amount: Number(e.target.value) || 0 }
                      : { label: '', amount: Number(e.target.value) || 0, currency: 'USD' }
                  }))}
                  placeholder="5000.00"
                  disabled={isVendorReadOnly}
                />
              </div>
              
              <div>
                <Label>Currency</Label>
                <Select 
                  value={quoteInput.competitor_baseline?.currency || 'USD'}
                  onValueChange={(value) => setQuoteInput(prev => ({
                    ...prev,
                    competitor_baseline: prev.competitor_baseline 
                      ? { ...prev.competitor_baseline, currency: value }
                      : { label: '', amount: 0, currency: value }
                  }))}
                  disabled={isVendorReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={goToNextStep}>
                Generate Quote
                <Calculator className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Summary & Export */}
      {currentStep === 'summary' && (
        <div className="space-y-6">
          {isGenerating ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Progress className="w-full mb-4" />
                  <p className="text-muted-foreground">Generating quote...</p>
                </div>
              </CardContent>
            </Card>
          ) : quoteResult ? (
            <>
              {/* Quote Lines */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Category</th>
                            <th className="text-left p-2">Code</th>
                            <th className="text-right p-2">Qty</th>
                            <th className="text-left p-2">UOM</th>
                            <th className="text-right p-2">Rate</th>
                            <th className="text-right p-2">Amount</th>
                            <th className="text-center p-2">Discountable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quoteResult.lines.map((line, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">
                                <Badge variant={line.category === 'Surcharge' ? 'destructive' : 'secondary'}>
                                  {line.category}
                                </Badge>
                              </td>
                              <td className="p-2 font-mono text-sm">{line.code}</td>
                              <td className="p-2 text-right">{line.qty}</td>
                              <td className="p-2">{line.uom.replace('_', ' ')}</td>
                              <td className="p-2 text-right">${line.rate.toFixed(2)}</td>
                              <td className="p-2 text-right font-semibold">${line.amount.toFixed(2)}</td>
                              <td className="p-2 text-center">
                                {line.discountable ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Totals Footer */}
              <div className="sticky bottom-0 bg-background border-t shadow-lg">
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Totals */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Before Discounts:</span>
                          <span className="font-mono">${quoteResult.totals.before_discounts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Discounts:</span>
                          <span className="font-mono">-${quoteResult.totals.discounts_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>After Discounts:</span>
                          <span className="font-mono">${quoteResult.totals.after_discounts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes:</span>
                          <span className="font-mono">${quoteResult.totals.taxes.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Grand Total:</span>
                          <span className="font-mono">${quoteResult.totals.grand_total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Comparison */}
                      {quoteResult.comparison && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Competitor Comparison</h4>
                          <div className="flex justify-between">
                            <span>{quoteInput.competitor_baseline?.label}:</span>
                            <span className="font-mono">${quoteResult.comparison.competitor_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Our Quote:</span>
                            <span className="font-mono">${quoteResult.totals.grand_total.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className={`flex justify-between font-bold ${
                            quoteResult.comparison.delta_amount < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <span>Difference:</span>
                            <span className="font-mono">
                              {quoteResult.comparison.delta_amount > 0 ? '+' : ''}
                              ${quoteResult.comparison.delta_amount.toFixed(2)} 
                              ({quoteResult.comparison.delta_percent > 0 ? '+' : ''}{quoteResult.comparison.delta_percent.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Export Actions */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <Button variant="outline" onClick={goToPreviousStep}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('PDF')}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('CSV')}>
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('XLSX')}>
                          <Download className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    </div>

                    {/* Export Digests */}
                    {Object.keys(exportDigests).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Export Digests</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(exportDigests).map(([format, digest]) => (
                            <div key={format} className="flex justify-between">
                              <span>{format}:</span>
                              <span className="font-mono">{digest}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Failed to generate quote</p>
                  <Button onClick={generateQuote} className="mt-4">
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default QuoteGenerator;