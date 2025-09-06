// V17.1.2-p8 — Products View (read-only)
import React from 'react';
import { safeNum, safeStr, fmtCurrency } from '@/lib/safe';
import { fetchProducts, type ProductLite } from '@/lib/products-api';

export default function ProductsView(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ProductLite[]>([]);

  React.useEffect(() => {
    (async () => {
      const data = await fetchProducts();
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-2">Products</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products found. (API flag off or empty dataset)
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Size</th>
                <th className="py-2">Monthly Storage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{safeStr(p.sku)}</td>
                  <td className="py-2 pr-3">{safeStr(p.description ?? '')}</td>
                  <td className="py-2 pr-3">{safeStr(p.size_class ?? '')}</td>
                  <td className="py-2">{fmtCurrency(safeNum(p.rate_monthly_storage, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}