// V17.2.0 — Quote Simulator (Debugger Tool)
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Play, FileText } from '@phosphor-icons/react';
import { QuoteInput, QuoteResult } from '@/lib/types';
import { quotePricingEngine, PricingContext } from '@/services/quote-pricing';
import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.2.0', 'quoting');

export function QuoteSimulator() {
  const [inputJson, setInputJson] = useState(JSON.stringify({
    version_id: "v2025Q1",
    lane: {
      origin: { country: "US", state: "CA", zip3: "900" },
      dest: { country: "US", state: "NY", zip3: "100" }
    },
    volumes: {
      units_received: 1000,
      orders_shipped: 500
    },
    vas: [
      { code: "KITTING", qty: 100 }
    ],
    discounts: [
      { code: "VOLUME_DISCOUNT", basis: "percent", value: 10, apply_to: "all" }
    ],
    assumptions: {
      storage_months: 3
    },
    competitor_baseline: {
      label: "Competitor A",
      amount: 5000,
      currency: "USD"
    }
  }, null, 2));
  
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSimulate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Parse input
      const quoteInput: QuoteInput = JSON.parse(inputJson);
      
      // Mock pricing context for simulation
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
            source_tag: 'simulator',
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
            source_tag: 'simulator',
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
            source_tag: 'simulator',
            confidence: 0.88
          }
        ],
        valueAddedOptions: [
          {
            version_id: quoteInput.version_id,
            code: 'KITTING',
            name: 'Kitting Services',
            pricing_type: 'fixed',
            unit: 'per_unit',
            default_rate: 2.50,
            currency: 'USD',
            category: 'VAS',
            source_tag: 'simulator',
            confidence: 0.90
          },
          {
            version_id: quoteInput.version_id,
            code: 'LABELING',
            name: 'Custom Labeling',
            pricing_type: 'fixed',
            unit: 'per_unit',
            default_rate: 0.75,
            currency: 'USD',
            category: 'VAS',
            source_tag: 'simulator',
            confidence: 0.90
          }
        ],
        version_id: quoteInput.version_id
      };

      // Generate quote
      const quoteResult = await quotePricingEngine.generateQuote(quoteInput, context);
      setResult(quoteResult);
      
      tag('quote_simulation_success', { 
        lineCount: quoteResult.lines.length,
        grandTotal: quoteResult.totals.grand_total 
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      tag('quote_simulation_failed', { error: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToDefault = () => {
    setInputJson(JSON.stringify({
      version_id: "v2025Q1",
      lane: {
        origin: { country: "US", state: "CA" },
        dest: { country: "US", state: "NY" }
      },
      volumes: {
        units_received: 1000,
        orders_shipped: 500
      }
    }, null, 2));
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Quote Simulator
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleSimulate} 
            disabled={isGenerating}
          >
            <Play className="h-4 w-4 mr-1" />
            {isGenerating ? 'Generating...' : 'Simulate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quote Input (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="font-mono text-xs min-h-[300px]"
              placeholder="Enter QuoteInput JSON"
            />
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quote Result</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                {/* Lines Summary */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    LINES ({result.lines.length})
                  </Label>
                  <div className="mt-1 space-y-1">
                    {result.lines.map((line, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {line.category}
                          </Badge>
                          <span className="font-mono">{line.code}</span>
                        </span>
                        <span className="font-mono">${line.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TOTALS
                  </Label>
                  <div className="mt-1 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Before Discounts:</span>
                      <span className="font-mono">${result.totals.before_discounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Discounts:</span>
                      <span className="font-mono">-${result.totals.discounts_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>After Discounts:</span>
                      <span className="font-mono">${result.totals.after_discounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span className="font-mono">${result.totals.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono">${result.totals.grand_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison */}
                {result.comparison && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        COMPARISON
                      </Label>
                      <div className="mt-1 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Competitor:</span>
                          <span className="font-mono">${result.comparison.competitor_amount.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${
                          result.comparison.delta_amount < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span>Delta:</span>
                          <span className="font-mono">
                            {result.comparison.delta_amount > 0 ? '+' : ''}
                            ${result.comparison.delta_amount.toFixed(2)} 
                            ({result.comparison.delta_percent > 0 ? '+' : ''}{result.comparison.delta_percent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {!result && !error && !isGenerating && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Enter quote input and click Simulate
              </div>
            )}
            
            {isGenerating && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Generating quote simulation...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}