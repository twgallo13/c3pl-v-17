// V17.1.2-p8b — add fetchProduct(id) detail reader
import { safeArr, safeNum, safeStr } from '@/lib/safe';

export type ProductLite = {
  id: string;
  sku: string;
  description?: string;
  size_class?: 'Small' | 'Medium' | 'Large' | string;
  rate_monthly_storage?: number;
};

export type ProductDetail = ProductLite & {
  attributes?: Record<string, unknown> | null;
  assigned_rates?: Record<string, number> | null;
  vendor?: string | null;
};

export async function fetchProducts(): Promise<ProductLite[]> {
  const useApi = (import.meta as any).env?.VITE_PRODUCTS_API === '1';
  if (!useApi) return [];
  try {
    const res = await fetch('/api/products', { method: 'GET' });
    if (!res.ok) return [];
    const json: any = await res.json().catch(() => ({}));
    const rows = safeArr(json?.items ?? json);

    return rows.map((r: any) => ({
      id: safeStr(r?.id || r?.sku),
      sku: safeStr(r?.sku),
      description: safeStr(r?.description ?? ''),
      size_class: safeStr(r?.size_class ?? ''),
      rate_monthly_storage: safeNum(r?.rate_monthly_storage, 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchProduct(id: string): Promise<ProductDetail | null> {
  const useApi = (import.meta as any).env?.VITE_PRODUCTS_API === '1';
  if (!useApi) return null;
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'GET' });
    if (!res.ok) return null;
    const r: any = await res.json().catch(() => null);
    if (!r) return null;
    return {
      id: safeStr(r?.id || r?.sku || id),
      sku: safeStr(r?.sku || id),
      description: safeStr(r?.description ?? ''),
      size_class: safeStr(r?.size_class ?? ''),
      rate_monthly_storage: safeNum(r?.rate_monthly_storage, 0),
      attributes: r?.attributes ?? null,
      assigned_rates: r?.assigned_rates ?? null,
      vendor: r?.vendor ? String(r.vendor) : null,
    };
  } catch {
    return null;
  }
}