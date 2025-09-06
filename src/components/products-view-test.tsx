// V17.1.2-p8c — Products View (read-only) with client-side filters
import React from 'react';
import { Link } from 'react-router-dom';
import { safeNum, safeStr, fmtCurrency } from '@/lib/safe';
  const [rows, setRows] = React.useState<ProductLite[]>([]);

  const [size, setSize] = React.useState<'All' | 'Sma

  const [rows, setRows] = React.useState<ProductLite[]>([]);

    })();

    const query = q.trim().toLowerCase();
    return rows.filter((p) => {

        safeStr(p.descrip
    (async () => {
      const rate = safeNum(p.rate_monthly

    });
    })();
    <div 

        {/* toolbar */}
    const query = q.trim().toLowerCase();
            onChange={(e) => setQ(e
    return rows.filter((p) => {
          />
            value
            className="border rounded px-3 py-2 text-sm
          >

            <option value="Large">Large</option>

            <input
              value={minStorage}

              aria-label="Minimum monthly storag
    });
            {loading ? 'Loading…' 

        {/
          <p className="text-sm
          <p className="text-sm text-muted
          </p>

        {/* toolbar */}
              <thead>
          <input
                  <th
                </tr>
              <tbody>
                  <tr key={p.id} className="border-b last:border-0">
                      <Link to={`/produc
          />
                 
                    <td 
                ))}
            </table>
        )}
          >
}


            <option value="Large">Large</option>



            <input

              value={minStorage}

















          </p>





              <thead>





                </tr>

              <tbody>

                  <tr key={p.id} className="border-b last:border-0">









                ))}

            </table>

        )}

    </div>

}