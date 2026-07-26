import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, ErrorNote } from './ui';

interface Props {
  children: ReactNode;
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
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md space-y-4 p-8">
          <ErrorNote message={this.state.error.message || 'Something went wrong in the admin panel.'} />
          <p className="text-sm text-slate-500">
            This can happen after a code update during development. Reload the page to recover.
          </p>
          <Button onClick={() => window.location.reload()}>Reload admin</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
