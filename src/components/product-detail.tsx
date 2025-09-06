// V17.1.2-p8d — Product Detail with role-gated "Edit Rates" shell (UI-only)
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct, type ProductDetail } from '@/lib/products-api';
import { fmtCurrency, safeNum, safeStr } from '@/lib/safe';
import { getRole, subscribe, type Role } from '@/lib/role-store';
import { checkAccess } from '@/lib/rbac';

export default function ProductDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<ProductDetail | null>(null);

  // role state for gating
  const [role, setRole] = React.useState<Role>(getRole());
  React.useEffect(() => subscribe(setRole), []);

  // UI-only edit shell state
  const [editOpen, setEditOpen] = React.useState(false);
  const allowed = checkAccess([role], ['Admin', 'Finance']).allowed;

  // local draft of rates (not persisted; UI-only)
  const [draftRates, setDraftRates] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    (async () => {
      const p = await fetchProduct(id);
      setItem(p);
      // seed draft from loaded data
      const src = (p?.assigned_rates ?? {}) as Record<string, unknown>;
      const seeded: Record<string, number> = {};
      Object.entries(src).forEach(([k, v]) => {
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isNaN(n)) seeded[k] = n;
      });
      setDraftRates(seeded);
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
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Assigned Rates</h4>
          <button
            type="button"
            onClick={() => setEditOpen((s) => !s)}
            className="text-sm underline"
          >
            {editOpen ? 'Close Edit' : 'Edit Rates'}
          </button>
        </div>

        {/* read-only list */}
        {!item.assigned_rates || Object.keys(item.assigned_rates).length === 0 ? (
          <p className="text-sm text-muted-foreground mb-2">No assigned rates.</p>
        ) : (
          <ul className="text-sm grid md:grid-cols-2 gap-2 mb-2">
            {Object.entries(item.assigned_rates!).map(([k, v]) => (
              <li key={k} className="flex justify-between border rounded px-2 py-1">
                <span className="mr-4">{k}</span>
                <span>{fmtCurrency(safeNum(v, 0))}</span>
              </li>
            ))}
          </ul>
        )}

        {/* UI-only edit shell (role-gated) */}
        {editOpen && (
          <div className="rounded border p-3 bg-muted/10">
            {!allowed ? (
              <div className="text-sm text-muted-foreground">
                You don't have permission to edit rates. (Read-only)
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // intentionally no persistence — UI shell only
                }}
                className="space-y-3"
              >
                <div className="grid md:grid-cols-2 gap-2">
                  {Object.keys(draftRates).length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No rates to edit.
                    </div>
                  ) : (
                    Object.entries(draftRates).map(([k, v]) => (
                      <label key={k} className="text-sm">
                        <span className="block mb-1">{k}</span>
                        <input
                          inputMode="decimal"
                          value={String(v)}
                          onChange={(ev) => {
                            const n = Number(ev.target.value);
                            setDraftRates((d) => ({
                              ...d,
                              [k]: Number.isNaN(n) ? 0 : n,
                            }));
                          }}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </label>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="border rounded px-3 py-1 text-sm opacity-60 cursor-not-allowed"
                    disabled
                    title="UI-only shell; persistence not implemented"
                  >
                    Save (disabled)
                  </button>
                  <span className="text-xs text-muted-foreground">
                    UI shell only — saving is intentionally disabled.
                  </span>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <Link to="/products" className="underline text-sm">← Back to Products</Link>
    </div>
  );
}