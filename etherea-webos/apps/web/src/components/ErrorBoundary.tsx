import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Etherea ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <section className="glass-card panel-content error-fallback" role="alert">
            <h3>Recovering Etherea UI</h3>
            <p>
              A rendering issue occurred. The shell is still active; please reload once while we stabilize your current session.
            </p>
          </section>
        )
      );
    }

    return this.props.children;
  }
}
