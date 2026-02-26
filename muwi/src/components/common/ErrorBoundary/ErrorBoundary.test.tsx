import { useState } from 'react';
import { fireEvent, render, screen } from '@/test';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb() {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('shows default fallback, forwards onError, and recovers on reset', () => {
    const onError = vi.fn();
    const onReset = vi.fn();

    function RecoverableTree() {
      const [shouldThrow, setShouldThrow] = useState(true);

      return (
        <ErrorBoundary
          onError={onError}
          onReset={() => {
            onReset();
            setShouldThrow(false);
          }}
        >
          {shouldThrow ? <Bomb /> : <p>Recovered content</p>}
        </ErrorBoundary>
      );
    }

    render(<RecoverableTree />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('renders optional recovery actions and invokes back-to-shelf callback', () => {
    const onNavigateHome = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(
      <ErrorBoundary onNavigateHome={onNavigateHome}>
        <Bomb />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to Shelf' }));
    expect(onNavigateHome).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Copy Error Details' }));
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
