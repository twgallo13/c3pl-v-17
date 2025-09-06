// V17.1.2-p8b — Product Detail (read-only)
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct, type ProductDetail } from '@/lib/products-api';
import { fmtCurrency, safeNum, safeStr } from '@/lib/safe';

export default function ProductDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<ProductDetail | null>(null);

  React.useEffect(() => {
    (async () => {
      const p = await fetchProduct(id);
      setItem(p);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="rounded border p-4 text-sm">Loading product…</div>;
  }

  if (!item) {
    return (
      <div className="rounded border p-4">
        <h3 className="font-medium mb-1">Product not found</h3>
        <p className="text-sm text-muted-foreground mb-3">
          The product could not be loaded (API off or ID not found).
        </p>
        <Link to="/products" className="underline text-sm">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="font-semibold text-lg">{safeStr(item.sku)}</h3>
        <p className="text-sm text-muted-foreground">{safeStr(item.description ?? '')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground">Size Class</div>
          <div className="font-medium">{safeStr(item.size_class ?? '')}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground">Monthly Storage</div>
          <div className="font-medium">
            {fmtCurrency(safeNum(item.rate_monthly_storage, 0))}
          </div>
        </div>
        <div className="rounded border p-4">
          <div className="text-xs text-muted-foreground">Vendor</div>
          <div className="font-medium">{safeStr(item.vendor ?? '')}</div>
        </div>
      </div>

      <div className="rounded border p-4">
        <h4 className="font-medium mb-2">Assigned Rates</h4>
        {!item.assigned_rates || Object.keys(item.assigned_rates).length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned rates.</p>
        ) : (
          <ul className="text-sm grid md:grid-cols-2 gap-2">
            {Object.entries(item.assigned_rates!).map(([k, v]) => (
              <li key={k} className="flex justify-between border rounded px-2 py-1">
                <span className="mr-4">{k}</span>
                <span>{fmtCurrency(safeNum(v, 0))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/products" className="underline text-sm">← Back to Products</Link>
    </div>
  );
}