import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
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

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            backgroundColor: '#FAFAFA',
            minHeight: '300px',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.5"
            style={{ marginBottom: '24px', opacity: 0.8 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#374151',
              margin: '0 0 8px 0',
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: '0 0 24px 0',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            An error occurred while rendering this component.
            {this.state.error?.message && (
              <span
                style={{
                  display: 'block',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </span>
            )}
          </p>

          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3D7A8C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4A90A4';
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
