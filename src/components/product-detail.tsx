// V17.1.2-p8f5c — Product detail (mock-capable)
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct, type ProductDetail as PD } from '@/lib/products-api';
import { fmtCurrency, safeNum, safeStr } from '@/lib/safe';

export default function ProductDetail(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [p, setP] = React.useState<PD | null>(null);

  React.useEffect(() => {
    (async () => {
      const data = await fetchProduct(id);
      setP(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-4">Loading product…</div>;

  if (!p) {
    return (
      <div className="rounded border p-6">
        <h3 className="font-medium mb-2">Product not found</h3>
        <Link to="/products" className="underline text-sm">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="font-medium mb-1">{safeStr(p.sku)}</h3>
        <p className="text-sm text-muted-foreground">{safeStr(p.description ?? '')}</p>
        <div className="text-sm mt-2">
          <div>Size: {safeStr(p.size_class ?? '')}</div>
          <div>Monthly Storage: {fmtCurrency(safeNum(p.rate_monthly_storage, 0))}</div>
          <div>Vendor: {safeStr(p.vendor ?? '')}</div>
        </div>
      </div>
      {p.assigned_rates && (
        <div className="rounded border p-4">
          <h4 className="font-medium mb-2">Assigned Rates</h4>
          <ul className="list-disc pl-6 text-sm">
            {Object.entries(p.assigned_rates).map(([k, v]) => (
              <li key={k}>
                {k}: {fmtCurrency(safeNum(v, 0))}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/products" className="underline text-sm">Back to products</Link>
    </div>
  );
}
