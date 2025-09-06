// V17.1.2-p8f5c — Products list (mock-capable)
import React from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, type ProductLite } from '@/lib/products-api';
import { safeStr } from '@/lib/safe';

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

  if (loading) return <div className="p-4">Loading products…</div>;

  if (!rows.length) {
    return (
      <div className="rounded border p-6">
        <h3 className="font-medium mb-1">Products</h3>
        <p className="text-sm text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-3">Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Size</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-3">
                  <Link to={`/products/${encodeURIComponent(p.id)}`} className="underline">
                    {safeStr(p.sku)}
                  </Link>
                </td>
                <td className="py-2 pr-3">{safeStr(p.description ?? '')}</td>
                <td className="py-2 pr-3">{safeStr(p.size_class ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
