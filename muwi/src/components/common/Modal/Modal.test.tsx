import { fireEvent, render, screen } from '@/test';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders in a portal and is accessible as a dialog', () => {
    const onClose = vi.fn();
    const { container } = render(
      <div data-testid="host">
        <Modal isOpen onClose={onClose} title="Settings">
          <p>Modal content</p>
        </Modal>
      </div>
    );

    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('closes on backdrop click and escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Close test">
        <button type="button">Action</button>
      </Modal>
    );

    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('traps focus within modal with tab and shift+tab', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Focus trap">
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>
    );

    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(second).toHaveFocus();

    second.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('includes animation transition styles', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Animation">
        <p>Animated</p>
      </Modal>
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    const dialog = screen.getByRole('dialog', { name: 'Animation' });
    expect(backdrop.style.transition).toContain('opacity');
    expect(dialog.style.transition).toContain('transform');
  });
});
