import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
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

  it('closes on backdrop click, escape key, and close button', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByTestId('modal-close-button'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('traps focus within modal with tab and shift+tab', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Focus trap">
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>
    );

    const closeButton = screen.getByTestId('modal-close-button');
    const second = screen.getByRole('button', { name: 'Second' });

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(second).toHaveFocus();

    second.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();
  });

  it('returns focus to trigger element after close', async () => {
    const user = userEvent.setup();

    function ModalHarness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open modal
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Focus return">
            <button type="button">Inside action</button>
          </Modal>
        </div>
      );
    }

    render(<ModalHarness />);

    const openButton = screen.getByRole('button', { name: 'Open modal' });
    await user.click(openButton);
    expect(screen.getByRole('dialog', { name: 'Focus return' })).toBeInTheDocument();

    await user.click(screen.getByTestId('modal-close-button'));
    expect(openButton).toHaveFocus();
  });

  it('uses tokenized modal backdrop, surface, and animation styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-modal-backdrop');
    expect(css).toContain('background: var(--color-bg-overlay);');
    expect(css).toContain('.muwi-modal');
    expect(css).toContain('border-radius: var(--radius-xl);');
    expect(css).toContain('box-shadow: var(--shadow-modal);');
    expect(css).toContain('transform: scale(0.97);');
  });

  it('renders close button even without title', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Animated</p>
      </Modal>
    );

    expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
  });
});
