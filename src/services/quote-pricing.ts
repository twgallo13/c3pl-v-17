// V17.2.0 — Quote Pricing Engine
import { logEvent, stamp } from '@/lib/build-log';
import { QuoteInput, QuoteResult, QuoteLine, BenchmarkRate, ValueAddedOption } from '@/lib/types';

const tag = stamp('V17.2.0', 'quoting');

export interface PricingContext {
  benchmarkRates: BenchmarkRate[];
  valueAddedOptions: ValueAddedOption[];
  version_id: string;
}

export type RoundingMode = 'HALF_UP' | 'HALF_EVEN';

export class QuotePricingEngine {
  private roundingMode: RoundingMode = 'HALF_UP';
  private precision: number = 2;

  async generateQuote(input: QuoteInput, context: PricingContext): Promise<QuoteResult> {
    try {
      tag('quote_generation_started', { 
        version_id: input.version_id, 
        lane: input.lane,
        volumes: input.volumes 
      });

      // Resolve rates for the lane
      const resolvedRates = this.resolveLaneRates(input.lane, context.benchmarkRates);
      
      // Generate quote lines
      const lines: QuoteLine[] = [];
      
      // Add receiving lines
      if (input.volumes.units_received) {
        lines.push(...this.generateReceivingLines(input.volumes.units_received, resolvedRates));
      }
      
      // Add fulfillment lines
      if (input.volumes.orders_shipped) {
        lines.push(...this.generateFulfillmentLines(input.volumes.orders_shipped, resolvedRates));
      }
      
      // Add storage lines
      if (input.assumptions?.storage_months) {
        lines.push(...this.generateStorageLines(input.assumptions.storage_months, resolvedRates));
      }
      
      // Add VAS lines
      if (input.vas) {
        lines.push(...this.generateVASLines(input.vas, context.valueAddedOptions));
      }
      
      // Add surcharge lines
      if (input.surcharges) {
        lines.push(...this.generateSurchargeLines(input.surcharges, context.valueAddedOptions));
      }

      // Calculate totals
      const totals = this.calculateTotals(lines, input.discounts);
      
      // Calculate comparison if baseline provided
      const comparison = input.competitor_baseline 
        ? this.calculateComparison(totals.grand_total, input.competitor_baseline)
        : undefined;

      const result: QuoteResult = {
        lines,
        totals,
        comparison
      };

      tag('quote_generated', { 
        lineCount: lines.length,
        grandTotal: totals.grand_total,
        hasComparison: !!comparison 
      });

      return result;
    } catch (error) {
      tag('quote_generation_failed', { error: error.message, input });
      throw error;
    }
  }

  private resolveLaneRates(lane: QuoteInput['lane'], rates: BenchmarkRate[]): BenchmarkRate[] {
    // Lane resolution specificity: zip3 → state → country
    const candidates = rates.filter(rate => {
      // Origin matching
      if (rate.origin_country !== lane.origin.country) return false;
      if (lane.origin.state && rate.origin_state && rate.origin_state !== lane.origin.state) return false;
      if (lane.origin.zip3 && rate.origin_zip3 && rate.origin_zip3 !== lane.origin.zip3) return false;
      
      // Destination matching  
      if (rate.dest_country !== lane.dest.country) return false;
      if (lane.dest.state && rate.dest_state && rate.dest_state !== lane.dest.state) return false;
      if (lane.dest.zip3 && rate.dest_zip3 && rate.dest_zip3 !== lane.dest.zip3) return false;
      
      return true;
    });

    // Sort by specificity (most specific first)
    return candidates.sort((a, b) => {
      const getSpecificity = (rate: BenchmarkRate) => {
        let score = 0;
        if (rate.origin_zip3) score += 4;
        else if (rate.origin_state) score += 2;
        else score += 1;
        
        if (rate.dest_zip3) score += 4;
        else if (rate.dest_state) score += 2;
        else score += 1;
        
        return score;
      };
      
      return getSpecificity(b) - getSpecificity(a);
    });
  }

  private generateReceivingLines(unitsReceived: number, rates: BenchmarkRate[]): QuoteLine[] {
    const receivingRates = rates.filter(r => r.mode === 'receiving');
    const lines: QuoteLine[] = [];
    
    // Basic receiving rate
    const baseRate = receivingRates.find(r => r.service_level === 'standard');
    if (baseRate) {
      lines.push({
        category: 'Receiving',
        code: 'RCV_STD',
        qty: unitsReceived,
        uom: 'per_unit',
        rate: baseRate.rate_benchmark,
        amount: this.roundAmount(unitsReceived * baseRate.rate_benchmark),
        discountable: true
      });
    }
    
    return lines;
  }

  private generateFulfillmentLines(ordersShipped: number, rates: BenchmarkRate[]): QuoteLine[] {
    const fulfillmentRates = rates.filter(r => r.mode === 'fulfillment');
    const lines: QuoteLine[] = [];
    
    // Pick & pack rate
    const pickPackRate = fulfillmentRates.find(r => r.service_level === 'pick_pack');
    if (pickPackRate) {
      lines.push({
        category: 'Fulfillment',
        code: 'PICK_PACK',
        qty: ordersShipped,
        uom: 'per_order',
        rate: pickPackRate.rate_benchmark,
        amount: this.roundAmount(ordersShipped * pickPackRate.rate_benchmark),
        discountable: true
      });
    }
    
    return lines;
  }

  private generateStorageLines(storageMonths: number, rates: BenchmarkRate[]): QuoteLine[] {
    const storageRates = rates.filter(r => r.mode === 'storage');
    const lines: QuoteLine[] = [];
    
    // Standard storage rate
    const baseStorageRate = storageRates.find(r => r.service_level === 'standard');
    if (baseStorageRate) {
      lines.push({
        category: 'Storage',
        code: 'STOR_STD',
        qty: storageMonths,
        uom: 'per_month',
        rate: baseStorageRate.rate_benchmark,
        amount: this.roundAmount(storageMonths * baseStorageRate.rate_benchmark),
        discountable: true
      });
    }
    
    return lines;
  }

  private generateVASLines(vas: QuoteInput['vas'], options: ValueAddedOption[]): QuoteLine[] {
    const lines: QuoteLine[] = [];
    
    if (!vas) return lines;
    
    for (const vasItem of vas) {
      const option = options.find(o => o.code === vasItem.code);
      if (option) {
        lines.push({
          category: 'VAS',
          code: vasItem.code,
          qty: vasItem.qty,
          uom: option.unit as QuoteLine['uom'],
          rate: option.default_rate,
          amount: this.roundAmount(vasItem.qty * option.default_rate),
          discountable: true
        });
      }
    }
    
    return lines;
  }

  private generateSurchargeLines(surcharges: QuoteInput['surcharges'], options: ValueAddedOption[]): QuoteLine[] {
    const lines: QuoteLine[] = [];
    
    if (!surcharges) return lines;
    
    for (const surcharge of surcharges) {
      const option = options.find(o => o.code === surcharge.code);
      if (option) {
        lines.push({
          category: 'Surcharge',
          code: surcharge.code,
          qty: surcharge.qty,
          uom: option.unit as QuoteLine['uom'],
          rate: option.default_rate,
          amount: this.roundAmount(surcharge.qty * option.default_rate),
          discountable: false // Surcharges are non-discountable by default
        });
      }
    }
    
    return lines;
  }

  private calculateTotals(lines: QuoteLine[], discounts?: QuoteInput['discounts']) {
    const beforeDiscounts = this.roundAmount(
      lines.reduce((sum, line) => sum + line.amount, 0)
    );

    let discountsTotal = 0;
    
    if (discounts) {
      // Apply discounts in order: Flat → Percent
      const sortedDiscounts = [...discounts].sort((a, b) => {
        if (a.basis === 'flat' && b.basis === 'percent') return -1;
        if (a.basis === 'percent' && b.basis === 'flat') return 1;
        return 0;
      });

      for (const discount of sortedDiscounts) {
        const applicableLines = this.getApplicableLines(lines, discount.apply_to);
        const applicableAmount = applicableLines.reduce((sum, line) => sum + line.amount, 0);
        
        let discountAmount = 0;
        if (discount.basis === 'flat') {
          discountAmount = Math.min(discount.value, applicableAmount);
        } else {
          discountAmount = this.roundAmount(applicableAmount * (discount.value / 100));
        }
        
        discountsTotal += discountAmount;
      }
    }

    // Ensure discounts don't exceed before_discounts amount
    discountsTotal = Math.min(discountsTotal, beforeDiscounts);

    const afterDiscounts = this.roundAmount(beforeDiscounts - discountsTotal);
    
    // Tax applied after discounts (mock 8.5% rate)
    const taxes = this.roundAmount(afterDiscounts * 0.085);
    const grandTotal = this.roundAmount(afterDiscounts + taxes);

    return {
      before_discounts: beforeDiscounts,
      discounts_total: discountsTotal,
      after_discounts: afterDiscounts,
      taxes,
      grand_total: grandTotal
    };
  }

  private getApplicableLines(lines: QuoteLine[], applyTo: string): QuoteLine[] {
    switch (applyTo) {
      case 'all':
        return lines.filter(line => line.discountable);
      case 'non_surcharges':
        return lines.filter(line => line.discountable && line.category !== 'Surcharge');
      default:
        if (applyTo.startsWith('category:')) {
          const category = applyTo.replace('category:', '');
          return lines.filter(line => line.discountable && line.category === category);
        }
        return [];
    }
  }

  private calculateComparison(grandTotal: number, baseline: { label: string; amount: number; currency: string }) {
    const deltaAmount = this.roundAmount(grandTotal - baseline.amount);
    const deltaPercent = baseline.amount > 0 
      ? this.roundAmount((deltaAmount / baseline.amount) * 100)
      : 0;

    return {
      competitor_amount: baseline.amount,
      delta_amount: deltaAmount,
      delta_percent: deltaPercent
    };
  }

  private roundAmount(amount: number): number {
    const factor = Math.pow(10, this.precision);
    
    if (this.roundingMode === 'HALF_UP') {
      return Math.round(amount * factor) / factor;
    } else {
      // HALF_EVEN (banker's rounding)
      const rounded = Math.round(amount * factor);
      const isEven = rounded % 2 === 0;
      const fraction = amount * factor - Math.floor(amount * factor);
      
      if (fraction === 0.5) {
        return isEven ? rounded / factor : (rounded - 1) / factor;
      }
      return rounded / factor;
    }
  }
}

export const quotePricingEngine = new QuotePricingEngine();