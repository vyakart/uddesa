import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '../Button';
import { formatRuntimeDiagnostics } from '@/utils/runtimeDiagnostics';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  onNavigateHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleCopyDiagnostics = async (): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    const errorBlock = this.state.error
      ? [
          `Route: ${typeof window !== 'undefined' ? window.location.pathname : '/'}`,
          `Error: ${this.state.error.message}`,
          this.state.error.stack ?? '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const diagnostics = formatRuntimeDiagnostics(10);
    const payload = [errorBlock, diagnostics].filter(Boolean).join('\n\n');
    if (!payload) {
      return;
    }

    await navigator.clipboard.writeText(payload);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="muwi-error-boundary" role="alert">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="muwi-error-boundary__icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h2 className="muwi-error-boundary__title">
            Something went wrong
          </h2>

          <p className="muwi-error-boundary__description">
            An error occurred while rendering this component.
            {this.state.error?.message && (
              <span className="muwi-error-boundary__message">
                {this.state.error.message}
              </span>
            )}
          </p>

          <div className="muwi-error-boundary__actions">
            <Button onClick={this.handleReset} variant="primary" size="md">
              Try Again
            </Button>
            {this.props.onNavigateHome ? (
              <Button onClick={this.props.onNavigateHome} variant="secondary" size="md">
                Back to Shelf
              </Button>
            ) : null}
            {typeof navigator !== 'undefined' && Boolean(navigator.clipboard) ? (
              <Button onClick={() => void this.handleCopyDiagnostics()} variant="ghost" size="md">
                Copy Error Details
              </Button>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
