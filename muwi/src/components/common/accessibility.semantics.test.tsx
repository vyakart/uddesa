import { act, fireEvent, render, screen } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { Button } from './Button';
import { CommandPalette } from './CommandPalette';
import { Modal } from './Modal';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { ToastProvider, useToast } from './Toast';
import { Toolbar, type ToolbarItem } from './Toolbar';

function ToastHarness() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        showToast({ message: 'Saved', title: 'Success', variant: 'success' });
      }}
    >
      Trigger toast
    </button>
  );
}

describe('accessibility semantics', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('applies required semantic roles to toolbar, sidebar, modal, and statusbar', () => {
    const toolbarItems: ToolbarItem[] = [{ id: 'refresh', label: 'Refresh', onClick: vi.fn() }];

    render(
      <>
        <Toolbar items={toolbarItems} ariaLabel="Editor tools" />
        <Sidebar title="Drafts" isOpen onBack={vi.fn()} onToggle={vi.fn()}>
          <button type="button">Item</button>
        </Sidebar>
        <StatusBar left="Ready" right="0 words" />
        <Modal isOpen onClose={vi.fn()} title="Settings">
          <p>Content</p>
        </Modal>
      </>
    );

    expect(screen.getByRole('toolbar', { name: 'Editor tools' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Drafts Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveAttribute('aria-modal', 'true');
  });

  it('applies dialog + combobox/listbox semantics in command palette', () => {
    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    render(<CommandPalette />);

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Command search' })).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('applies toast viewport and live-status semantics', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger toast' }));

    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });

  it('marks decorative icons as aria-hidden while icon-only controls expose labels', () => {
    render(
      <Button
        type="button"
        iconOnly
        aria-label="Open settings"
        leadingIcon={<svg data-testid="decorative-icon" />}
      />
    );

    const iconOnlyButton = screen.getByRole('button', { name: 'Open settings' });
    expect(iconOnlyButton).toBeInTheDocument();
    expect(screen.getByTestId('decorative-icon').closest('.muwi-button__icon')).toHaveAttribute('aria-hidden', 'true');
  });
});
