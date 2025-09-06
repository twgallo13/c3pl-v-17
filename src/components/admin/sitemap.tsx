// V17.1.2-p7-min — Admin Sitemap (minimal, robust)
import React from "react";
import { ROUTES } from "@/routes/registry";

export default function AdminSitemap() {
  // Show the registry as JSON to avoid JSX table issues
  const json = React.useMemo(() => JSON.stringify(ROUTES, null, 2), []);
  return (
    <div className="rounded border p-4">
      <h3 className="font-medium mb-3">Sitemap</h3>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{json}</pre>
    </div>
  );
}