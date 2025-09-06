// V17.1.2-p5b — RMA Adjustments (compile-stable minimal view)
import React from 'react';
type RmaAdjustment = {

  gl_journal_id?: stri
};
const MOCK_ROWS: RmaAdjus
export default fun

    return (
  

      </div>

  return (
      <h3 className="font-medium mb-3">RMA Adjustments</h3>

            <tr class
            
              <th className="py-2">Posted<
          </thead>
            {rows.map((r) => (
                <td className="py-2 pr-3">{safeStr(r.artifact_type)}
            
            
      
   







            <tr className="text-left border-b">
              <th className="py-2 pr-3">Artifact</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">GL Journal</th>
              <th className="py-2">Posted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{safeStr(r.artifact_type)}</td>
                <td className="py-2 pr-3">{fmtCurrency(safeNum(r.amount, 0))}</td>
                <td className="py-2 pr-3">{safeStr(r.gl_journal_id ?? '')}</td>
                <td className="py-2">{safeStr(r.posted_at ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}