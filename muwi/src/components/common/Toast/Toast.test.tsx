import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@/test';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Harness() {
  const { showToast } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          showToast({
            title: 'Saved',
            message: 'Draft saved to local storage.',
            variant: 'success',
          });
        }}
      >
        Show success toast
      </button>
      <button
        type="button"
        onClick={() => {
          showToast({
            message: 'Warning notification.',
            variant: 'warning',
          });
        }}
      >
        Show warning toast
      </button>
      <button
        type="button"
        onClick={() => {
          showToast({
            message: 'Error notification.',
            variant: 'error',
          });
        }}
      >
        Show error toast
      </button>
      <button
        type="button"
        onClick={() => {
          showToast({
            message: 'Informational notification.',
            variant: 'info',
          });
        }}
      >
        Show info toast
      </button>
    </div>
  );
}

describe('Toast system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toasts in a bottom-center viewport with icon slot and variants', async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    const viewport = screen.getByRole('region', { name: 'Notifications' });
    expect(viewport).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show success toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show warning toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show error toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show info toast' }));

    expect(screen.getByText('Draft saved to local storage.').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'success'
    );
    expect(screen.getByText('Warning notification.').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'warning'
    );
    expect(screen.getByText('Error notification.').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'error'
    );
    expect(screen.getByText('Informational notification.').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'info'
    );
  });

  it('auto-dismisses after 4 seconds by default', async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show info toast' }));
    expect(screen.getByText('Informational notification.')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('Informational notification.')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Informational notification.')).not.toBeInTheDocument();
  });

  it('pauses auto-dismiss while hovered and focused', async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show info toast' }));
    const toast = screen.getByText('Informational notification.').closest('.muwi-toast');
    expect(toast).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.mouseEnter(toast!);
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Informational notification.')).toBeInTheDocument();

    fireEvent.mouseLeave(toast!);
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Informational notification.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show info toast' }));
    const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
    await act(async () => {
      fireEvent.focus(dismissButton);
    });
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText('Informational notification.')).toBeInTheDocument();

    await act(async () => {
      fireEvent.blur(dismissButton);
    });
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Informational notification.')).not.toBeInTheDocument();
  });

  it('uses tokenized viewport and toast styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-toast-viewport');
    expect(css).toContain('left: 50%;');
    expect(css).toContain('bottom: var(--space-6);');
    expect(css).toContain('.muwi-toast');
    expect(css).toContain('border-radius: var(--radius-md);');
    expect(css).toContain('box-shadow: var(--shadow-lg);');
    expect(css).toContain('.muwi-toast[data-variant=\'success\'] .muwi-toast__icon');
  });
});
