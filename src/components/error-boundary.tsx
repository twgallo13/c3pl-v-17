// V17.1.2 — error boundary with versioned IDs and dedupe
import React from 'react';
import { logEvent } from '@/lib/build-log';
import { getActiveVersion } from '@/lib/version';

function mkErrorId() {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 10);
  return `err-${ts}-${rnd}`;
}

type State = { hasError: boolean; errId?: string; message?: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{ actor?: string; module?: string }>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(e: unknown): State {
    return { 
      hasError: true, 
      errId: mkErrorId(), 
      message: e instanceof Error ? e.message : String(e) 
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const errId = this.state.errId ?? mkErrorId();
    const version = getActiveVersion();
    
    logEvent({
      version,
      module: this.props.module ?? 'app',
      action: 'ui_exception',
      details: { 
        errId, 
        message: this.state.message, 
        stack: (error as any)?.stack, 
        componentStack: info.componentStack 
      },
      actor: this.props.actor ?? 'unknown'
    });
    
    // Dedupe identical error within sessionStorage
    try {
      const key = `c3pl.err.${errId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      const { errId } = this.state;
      return (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h2 className="text-lg font-semibold text-destructive">Application Error</h2>
          <p className="mt-2 text-sm text-destructive/80">An unexpected error occurred. The error has been logged for investigation.</p>
          {errId && <p className="mt-2 text-xs text-muted-foreground">Error ID: {errId}</p>}
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => location.reload()} 
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Reload Page
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, errId: undefined, message: undefined })} 
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}