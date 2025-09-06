// V17.1.2-rma-sync-hotfix — minimal error boundary + HOC
import React from "react";

export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  meta: { module?: string; component?: string } = {},
) {
  return function Wrapped(props: T) {
    try {
      return <Component {...props} />;
    } catch (e) {
      console.error("error-boundary", meta, e);
      return <div className="rounded border p-4">Something went wrong.</div>;
    }
  };
}

export default function ErrorBoundary({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}
