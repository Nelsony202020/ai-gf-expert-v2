import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, ErrorNote } from './ui';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin panel error:', error, info);
    // #region agent log
    fetch('http://127.0.0.1:7312/ingest/3642bd41-13da-4f13-9a24-64f7a557b0e1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '28e868' },
      body: JSON.stringify({
        sessionId: '28e868',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'ErrorBoundary.tsx:componentDidCatch',
        message: 'Admin error boundary caught error',
        data: {
          errorMessage: error.message,
          componentStack: info.componentStack?.slice(0, 500) ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md space-y-4 p-8">
          <ErrorNote message={this.state.error.message || 'Something went wrong in the admin panel.'} />
          <p className="text-sm text-slate-500">
            This can happen after a code update during development. Reload the page to recover.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                this.props.onReset?.();
                this.setState({ error: null });
              }}
            >
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>Reload admin</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
