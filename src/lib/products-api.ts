// V17.1.2-p8f5 — Products API (relative safe import; mock support)
import { safeArr, safeNum, safeStr } from './safe';

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

function isMock() {
    return ((import.meta as any).env?.VITE_PRODUCTS_API || '').toLowerCase() === 'mock';
}

export async function fetchProducts(): Promise<ProductLite[]> {
    const flag = (import.meta as any).env?.VITE_PRODUCTS_API;
    if (flag !== '1' && !isMock()) return [];
    try {
        const url = isMock() ? '/mock/products.json' : '/api/products';
        const res = await fetch(url, { method: 'GET' });
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
    const flag = (import.meta as any).env?.VITE_PRODUCTS_API;
    if (flag !== '1' && !isMock()) return null;
    try {
        const url = isMock() ? '/mock/products.json' : `/api/products/${encodeURIComponent(id)}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) return null;

        if (isMock()) {
            const all: any[] = await res.json().catch(() => []);
            const r: any = safeArr(all).find(
                (x) => safeStr(x?.id) === id || safeStr(x?.sku) === id
            );
            if (!r) return null;
            return {
                id: safeStr(r?.id || r?.sku || id),
                sku: safeStr(r?.sku || id),
                description: safeStr(r?.description ?? ''),
                size_class: safeStr(r?.size_class ?? ''),
                rate_monthly_storage: safeNum(r?.rate_monthly_storage, 0),
                attributes: r?.attributes ?? null,
                assigned_rates: (r?.assigned_rates as Record<string, number>) ?? null,
                vendor: r?.vendor ? String(r.vendor) : null,
            };
        } else {
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
        }
    } catch {
        return null;
    }
}