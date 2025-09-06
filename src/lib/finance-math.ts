/**
 * C3PL V17.1.3 Finance Math Service
 * Centralized discount, tax, and rounding calculations with enforcement
 */

import { roundCurrency } from './gl-posting';
import { logEvent, stamp } from './build-log';

const tag = stamp('V17.1.3', 'finance-math');

export type DiscountType = 'flat' | 'percent';
export type DiscountScope = 'all' | 'non_surcharges' | `category:${string}`;
export type RoundingMode = 'HALF_UP' | 'HALF_EVEN';

export interface Discount {
  id: string;
  type: DiscountType;
  value: number;           // Dollar amount for flat, percentage (0-100) for percent
  scope: DiscountScope;
  description: string;
}

export interface LineItem {
  id: string;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
  category?: string;
  discountable: boolean;   // Duties lines are non-discountable by default
  isSurcharge?: boolean;   // Shipping, handling fees, etc.
}

export interface CalculationResult {
  lineItems: ProcessedLineItem[];
  subtotal: number;           // Sum of (qty × unitPrice) for all lines
  discountAmount: number;     // Total discount applied
  afterDiscounts: number;     // Subtotal - discountAmount
  taxAmount: number;          // Tax calculated on afterDiscounts
  grandTotal: number;         // afterDiscounts + taxAmount
  appliedDiscounts: AppliedDiscount[];
}

export interface ProcessedLineItem extends LineItem {
  lineSubtotal: number;       // qty × unitPrice
  discountAmount: number;     // Total discount on this line
  afterDiscounts: number;     // lineSubtotal - discountAmount
  taxableAmount: number;      // Amount subject to tax
}

export interface AppliedDiscount {
  discountId: string;
  description: string;
  amount: number;
  appliedToLines: string[];   // Line IDs this discount affected
}

/**
 * Calculate invoice totals with proper discount and tax application
 */
export function calculateInvoiceTotals(
  lineItems: LineItem[],
  discounts: Discount[],
  taxRate: number = 0,        // Tax rate as decimal (e.g., 0.08 for 8%)
  roundingMode: RoundingMode = 'HALF_UP'
): CalculationResult {
  // Validate inputs
  validateLineItems(lineItems);
  validateDiscounts(discounts);
  validateTaxRate(taxRate);
  
  // Calculate line subtotals
  const processedLines: ProcessedLineItem[] = lineItems.map(line => ({
    ...line,
    lineSubtotal: roundCurrency(line.qty * line.unitPrice),
    discountAmount: 0,
    afterDiscounts: 0,
    taxableAmount: 0
  }));
  
  // Calculate subtotal
  const subtotal = processedLines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  
  // Apply discounts in order: flat first, then percent
  const sortedDiscounts = [...discounts].sort((a, b) => {
    if (a.type === 'flat' && b.type === 'percent') return -1;
    if (a.type === 'percent' && b.type === 'flat') return 1;
    return 0;
  });
  
  const appliedDiscounts: AppliedDiscount[] = [];
  let totalDiscountAmount = 0;
  
  for (const discount of sortedDiscounts) {
    const discountResult = applyDiscount(processedLines, discount);
    totalDiscountAmount += discountResult.amount;
    appliedDiscounts.push(discountResult);
  }
  
  // Update afterDiscounts for each line
  processedLines.forEach(line => {
    line.afterDiscounts = roundCurrency(line.lineSubtotal - line.discountAmount);
    line.taxableAmount = line.afterDiscounts; // Tax basis is after discounts
  });
  
  const afterDiscounts = roundCurrency(subtotal - totalDiscountAmount);
  
  // Calculate tax on discounted amount
  const taxAmount = roundCurrency(afterDiscounts * taxRate, roundingMode);
  
  const grandTotal = roundCurrency(afterDiscounts + taxAmount);
  
  const result: CalculationResult = {
    lineItems: processedLines,
    subtotal: roundCurrency(subtotal),
    discountAmount: roundCurrency(totalDiscountAmount),
    afterDiscounts,
    taxAmount,
    grandTotal,
    appliedDiscounts
  };
  
  tag('totals_calculated', {
    lineCount: lineItems.length,
    subtotal: result.subtotal,
    discountAmount: result.discountAmount,
    afterDiscounts: result.afterDiscounts,
    taxRate,
    taxAmount: result.taxAmount,
    grandTotal: result.grandTotal,
    discountCount: discounts.length
  });
  
  return result;
}

/**
 * Apply a single discount to line items
 */
function applyDiscount(lines: ProcessedLineItem[], discount: Discount): AppliedDiscount {
  const eligibleLines = lines.filter(line => isLineEligibleForDiscount(line, discount));
  
  if (eligibleLines.length === 0) {
    return {
      discountId: discount.id,
      description: discount.description,
      amount: 0,
      appliedToLines: []
    };
  }
  
  let totalDiscountAmount = 0;
  const appliedToLines: string[] = [];
  
  if (discount.type === 'flat') {
    // Distribute flat discount proportionally across eligible lines
    const eligibleSubtotal = eligibleLines.reduce((sum, line) => 
      sum + (line.lineSubtotal - line.discountAmount), 0);
    
    if (eligibleSubtotal > 0) {
      for (const line of eligibleLines) {
        const lineNetAmount = line.lineSubtotal - line.discountAmount;
        const proportion = lineNetAmount / eligibleSubtotal;
        const lineDiscountAmount = roundCurrency(discount.value * proportion);
        
        line.discountAmount += lineDiscountAmount;
        totalDiscountAmount += lineDiscountAmount;
        appliedToLines.push(line.id);
      }
    }
  } else if (discount.type === 'percent') {
    // Apply percentage discount to each eligible line
    for (const line of eligibleLines) {
      const lineNetAmount = line.lineSubtotal - line.discountAmount;
      const lineDiscountAmount = roundCurrency(lineNetAmount * (discount.value / 100));
      
      line.discountAmount += lineDiscountAmount;
      totalDiscountAmount += lineDiscountAmount;
      appliedToLines.push(line.id);
    }
  }
  
  return {
    discountId: discount.id,
    description: discount.description,
    amount: roundCurrency(totalDiscountAmount),
    appliedToLines
  };
}

/**
 * Check if a line item is eligible for a discount
 */
function isLineEligibleForDiscount(line: ProcessedLineItem, discount: Discount): boolean {
  // Non-discountable lines (like duties) are never eligible
  if (!line.discountable) {
    return false;
  }
  
  switch (discount.scope) {
    case 'all':
      return true;
    case 'non_surcharges':
      return !line.isSurcharge;
    default:
      if (discount.scope.startsWith('category:')) {
        const targetCategory = discount.scope.substring(9);
        return line.category === targetCategory;
      }
      return false;
  }
}

/**
 * Round currency with specified mode
 */
function roundCurrency(amount: number, mode: RoundingMode = 'HALF_UP'): number {
  const multiplied = amount * 100;
  
  if (mode === 'HALF_UP') {
    return Math.round(multiplied) / 100;
  } else if (mode === 'HALF_EVEN') {
    // Banker's rounding
    const floored = Math.floor(multiplied);
    const remainder = multiplied - floored;
    
    if (remainder < 0.5) {
      return floored / 100;
    } else if (remainder > 0.5) {
      return Math.ceil(multiplied) / 100;
    } else {
      // Exactly 0.5 - round to even
      return (floored % 2 === 0 ? floored : floored + 1) / 100;
    }
  }
  
  return Math.round(multiplied) / 100;
}

/**
 * Validate line items
 */
function validateLineItems(lineItems: LineItem[]): void {
  if (!lineItems || lineItems.length === 0) {
    throw new Error('Line items cannot be empty');
  }
  
  for (const line of lineItems) {
    if (!line.id || line.id.trim() === '') {
      throw new Error('Line item missing ID');
    }
    
    if (!line.sku || line.sku.trim() === '') {
      throw new Error(`Line item ${line.id} missing SKU`);
    }
    
    if (line.qty <= 0) {
      throw new Error(`Line item ${line.id} quantity must be > 0`);
    }
    
    if (line.unitPrice < 0) {
      throw new Error(`Line item ${line.id} unit price cannot be negative`);
    }
    
    if (!Number.isFinite(line.qty) || !Number.isFinite(line.unitPrice)) {
      throw new Error(`Line item ${line.id} has invalid numeric values`);
    }
  }
}

/**
 * Validate discounts
 */
function validateDiscounts(discounts: Discount[]): void {
  for (const discount of discounts) {
    if (!discount.id || discount.id.trim() === '') {
      throw new Error('Discount missing ID');
    }
    
    if (discount.type === 'percent' && (discount.value < 0 || discount.value > 100)) {
      throw new Error(`Discount ${discount.id} percentage must be 0-100`);
    }
    
    if (discount.type === 'flat' && discount.value < 0) {
      throw new Error(`Discount ${discount.id} flat amount cannot be negative`);
    }
    
    if (!Number.isFinite(discount.value)) {
      throw new Error(`Discount ${discount.id} has invalid value`);
    }
  }
}

/**
 * Validate tax rate
 */
function validateTaxRate(taxRate: number): void {
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be a number between 0 and 1');
  }
}

/**
 * Create default duties line item (non-discountable)
 */
export function createDutiesLineItem(
  id: string,
  amount: number,
  description: string = 'Import Duties'
): LineItem {
  return {
    id,
    sku: 'DUTY-001',
    description,
    qty: 1,
    unitPrice: amount,
    category: 'duties',
    discountable: false,  // Duties are non-discountable by default
    isSurcharge: true
  };
}

/**
 * Create shipping line item (typically non-discountable surcharge)
 */
export function createShippingLineItem(
  id: string,
  amount: number,
  method: string = 'Standard'
): LineItem {
  return {
    id,
    sku: 'SHIP-001',
    description: `Shipping - ${method}`,
    qty: 1,
    unitPrice: amount,
    category: 'shipping',
    discountable: false,
    isSurcharge: true
  };
}