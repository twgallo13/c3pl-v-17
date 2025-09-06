// V17.1.2-p8c — Products View (read-only) with client-side filters
import React from 'react';
import { Link } from 'react-router-dom';
import { safeNum, safeStr, fmtCurrency } from '@/lib/safe';
import { fetchProducts, type ProductLite } from '@/lib/products-api';

export default function ProductsView(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ProductLite[]>([]);

  // filters
  const [q, setQ] = React.useState(''); // text filter: SKU / description
  const [size, setSize] = React.useState<'All' | 'Small' | 'Medium' | 'Large'>('All');
  const [minStorage, setMinStorage] = React.useState<string>(''); // numeric text

  React.useEffect(() => {
    (async () => {
      const data = await fetchProducts();
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    const min = Number(minStorage);
    return rows.filter((p) => {
      const matchText =
        !query ||
        safeStr(p.sku).toLowerCase().includes(query) ||
        safeStr(p.description ?? '').toLowerCase().includes(query);

      const matchSize = size === 'All' || safeStr(p.size_class ?? '') === size;

      const rate = safeNum(p.rate_monthly_storage, 0);
      const matchMin = !Number.isFinite(min) || minStorage === '' || rate >= min;

      return matchText && matchSize && matchMin;
    });
  }, [rows, q, size, minStorage]);

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <h3 className="font-medium mb-2">Products</h3>

        {/* toolbar */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU or description…"
            className="border rounded px-3 py-2 text-sm min-w-[240px]"
            aria-label="Search products"
          />
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
            aria-label="Filter by size class"
          >
            <option value="All">All sizes</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Min monthly storage</label>
            <input
              inputMode="decimal"
              value={minStorage}
              onChange={(e) => setMinStorage(e.target.value)}
              placeholder="0.00"
              className="border rounded px-2 py-2 text-sm w-28"
              aria-label="Minimum monthly storage rate"
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {loading ? 'Loading…' : `${filtered.length} of ${rows.length} shown`}
          </div>
        </div>

        {/* states */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products found. (API flag off or empty dataset)
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results match your filters.</p>
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
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">
                      <Link to={`/products/${encodeURIComponent(p.id)}`} className="underline">
                        {safeStr(p.sku)}
                      </Link>
                    </td>
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
    </div>
  );
}