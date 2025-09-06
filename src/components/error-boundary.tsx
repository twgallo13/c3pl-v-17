/**
 * C3PL V17.1.2 Error Boundary
 * Global error boundary with persona context logging and non-blocking UI
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logEvent } from "@/lib/build-log";
import { AlertTriangle, RefreshCw, Bug } from "@phosphor-icons/react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    errorId: string;
  }>;
  actor?: string;
  module?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { actor = "system", module = "error-boundary" } = this.props;
    const errorId = this.state.errorId || `err-${Date.now()}`;

    // Log error with persona context
    logEvent({
      version: "V17.1.2",
      module: module,
      action: "error_caught",
      details: {
        errorId,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      actor
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Report to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // window.reportError?.(error, errorInfo, errorId);
    }
  }

  resetError = () => {
    const { actor = "system", module = "error-boundary" } = this.props;
    const { errorId } = this.state;

    logEvent({
      version: "V17.1.2",
      module: module,
      action: "error_reset",
      details: { errorId },
      actor
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const { fallback: Fallback } = this.props;

      if (Fallback && error && errorId) {
        return <Fallback error={error} resetError={this.resetError} errorId={errorId} />;
      }

      return <DefaultErrorFallback 
        error={error} 
        resetError={this.resetError} 
        errorId={errorId} 
      />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  errorId: string | null;
}

function DefaultErrorFallback({ error, resetError, errorId }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Application Error
          <Badge variant="destructive" className="text-xs">
            V17.1.2
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>An unexpected error occurred. The error has been logged for investigation.</p>
          {errorId && (
            <p className="font-mono text-xs mt-1">
              Error ID: <span className="font-medium">{errorId}</span>
            </p>
          )}
        </div>

        {isDevelopment && error && (
          <div className="space-y-2">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-destructive hover:text-destructive/80">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <p className="font-medium text-destructive">{error.name}: {error.message}</p>
                {error.stack && (
                  <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={resetError}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>

          {isDevelopment && (
            <Button
              onClick={() => {
                console.error("Error details:", { error, errorId });
                console.trace("Error boundary trace");
              }}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Log to Console
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
          <p className="font-medium mb-1">For Support:</p>
          <ul className="space-y-1">
            <li>• Include Error ID: {errorId}</li>
            <li>• Describe what you were doing when this occurred</li>
            <li>• Check if the error persists after refresh</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options?: {
    fallback?: React.ComponentType<{
      error: Error;
      resetError: () => void;
      errorId: string;
    }>;
    actor?: string;
    module?: string;
  }
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorReporting(actor: string = "component", module: string = "unknown") {
  return React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logEvent({
      version: "V17.1.2",
      module,
      action: "manual_error_report",
      details: {
        errorId,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        context
      },
      actor
    });

    return errorId;
  }, [actor, module]);
}