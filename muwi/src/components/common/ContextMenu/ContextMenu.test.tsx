import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@/test';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

function createItems(spies?: {
  openSpy?: ReturnType<typeof vi.fn>;
  renameSpy?: ReturnType<typeof vi.fn>;
  duplicateSpy?: ReturnType<typeof vi.fn>;
}) {
  const openSpy = spies?.openSpy ?? vi.fn();
  const renameSpy = spies?.renameSpy ?? vi.fn();
  const duplicateSpy = spies?.duplicateSpy ?? vi.fn();

  const items: ContextMenuItem[] = [
    { id: 'open', label: 'Open', onSelect: openSpy },
    {
      id: 'more',
      label: 'More',
      submenu: [
        { id: 'rename', label: 'Rename', onSelect: renameSpy },
        { id: 'duplicate', label: 'Duplicate', onSelect: duplicateSpy },
      ],
    },
  ];

  return { items, openSpy, renameSpy, duplicateSpy };
}

describe('ContextMenu', () => {
  it('appears at click position and is accessible as menu', () => {
    const { items } = createItems();
    render(<ContextMenu isOpen x={120} y={180} items={items} onClose={vi.fn()} />);

    const menu = screen.getByRole('menu', { name: 'Context menu' });
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveStyle({ left: '120px', top: '180px' });
  });

  it('keeps menu within viewport bounds', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 240 });

    const { items } = createItems();
    render(<ContextMenu isOpen x={500} y={500} items={items} onClose={vi.fn()} />);

    const menu = screen.getByRole('menu', { name: 'Context menu' });
    expect(parseInt(menu.style.left, 10)).toBeGreaterThanOrEqual(8);
    expect(parseInt(menu.style.left, 10)).toBeLessThanOrEqual(window.innerWidth - 200 - 8);
    expect(parseInt(menu.style.top, 10)).toBeGreaterThanOrEqual(8);
    expect(parseInt(menu.style.top, 10)).toBeLessThanOrEqual(window.innerHeight - 8);
  });

  it('supports keyboard navigation with enter and escape', () => {
    const onClose = vi.fn();
    const { items, renameSpy } = createItems();
    render(<ContextMenu isOpen x={20} y={20} items={items} onClose={onClose} />);

    const menu = screen.getByRole('menu', { name: 'Context menu' });
    menu.focus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowRight' });
    expect(screen.getByRole('menu', { name: 'Submenu' })).toBeInTheDocument();

    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(renameSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('supports submenu keyboard navigation and separator rendering branches', () => {
    const onClose = vi.fn();
    const openSpy = vi.fn();
    const renameSpy = vi.fn();
    const duplicateSpy = vi.fn();

    const items: ContextMenuItem[] = [
      {
        id: 'open',
        label: 'Open',
        shortcut: '⌘O',
        icon: <span>icon-open</span>,
        onSelect: openSpy,
      },
      {
        id: 'more',
        label: 'More',
        submenu: [
          { id: 'sub-disabled', label: 'Disabled sub', disabled: true, onSelect: vi.fn() },
          { id: 'rename', label: 'Rename', shortcut: 'R', icon: <span>icon-rename</span>, onSelect: renameSpy },
          { id: 'sub-separator', type: 'separator' },
          { id: 'duplicate', label: 'Duplicate', onSelect: duplicateSpy },
        ],
      },
    ];

    render(<ContextMenu isOpen x={20} y={20} items={items} onClose={onClose} />);
    const menu = screen.getByRole('menu', { name: 'Context menu' });
    menu.focus();

    expect(screen.getByText('⌘O')).toBeInTheDocument();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(screen.getByRole('menu', { name: 'Submenu' })).toBeInTheDocument();
    expect(screen.getAllByRole('separator').length).toBeGreaterThan(0);

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    fireEvent.keyDown(menu, { key: 'ArrowLeft' });
    expect(screen.queryByRole('menu', { name: 'Submenu' })).not.toBeInTheDocument();

    fireEvent.keyDown(menu, { key: 'ArrowRight' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(renameSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking outside and supports submenu via hover', () => {
    const onClose = vi.fn();
    const { items } = createItems();
    render(
      <div>
        <button type="button">Outside</button>
        <ContextMenu isOpen x={50} y={50} items={items} onClose={onClose} />
      </div>
    );

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: 'More' }));
    expect(screen.getByRole('menu', { name: 'Submenu' })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not execute disabled or nested-submenu actions on click', () => {
    const onClose = vi.fn();
    const leafSpy = vi.fn();
    const items: ContextMenuItem[] = [
      { id: 'disabled-root', label: 'Disabled root', disabled: true, onSelect: vi.fn() },
      {
        id: 'more',
        label: 'More',
        submenu: [
          { id: 'disabled-sub', label: 'Disabled sub', disabled: true, onSelect: vi.fn() },
          {
            id: 'nested-submenu',
            label: 'Nested submenu',
            submenu: [{ id: 'leaf-child', label: 'Leaf child', onSelect: vi.fn() }],
          },
          { id: 'leaf', label: 'Leaf', onSelect: leafSpy },
        ],
      },
    ];

    render(<ContextMenu isOpen x={40} y={40} items={items} onClose={onClose} />);

    const disabledRoot = screen.getByRole('menuitem', { name: 'Disabled root' });
    fireEvent.mouseEnter(disabledRoot);
    fireEvent.click(disabledRoot);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: 'More' }));
    const submenu = screen.getByRole('menu', { name: 'Submenu' });
    expect(submenu).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: 'Disabled sub' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disabled sub' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nested submenu' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Leaf' }));
    expect(leafSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders separator, destructive item, and disabled item states', () => {
    const items: ContextMenuItem[] = [
      { id: 'open', label: 'Open', onSelect: vi.fn() },
      { id: 'sep-1', type: 'separator' },
      { id: 'delete', label: 'Delete', destructive: true, onSelect: vi.fn() },
      { id: 'disabled', label: 'Disabled action', disabled: true, onSelect: vi.fn() },
    ];

    render(<ContextMenu isOpen x={24} y={24} items={items} onClose={vi.fn()} />);

    expect(screen.getAllByRole('separator')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-destructive', 'true');
    expect(screen.getByRole('menuitem', { name: 'Disabled action' })).toBeDisabled();
  });

  it('closes on tab and returns focus to trigger element', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      const items: ContextMenuItem[] = [{ id: 'open', label: 'Open', onSelect: vi.fn() }];

      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open menu
          </button>
          <ContextMenu isOpen={isOpen} x={80} y={80} items={items} onClose={() => setIsOpen(false)} />
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });

    await user.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Context menu' });
    await waitFor(() => expect(menu).toHaveFocus());

    fireEvent.keyDown(menu, { key: 'Tab' });

    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: 'Context menu' })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('closes safely when return-focus target is removed before cleanup', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      const items: ContextMenuItem[] = [{ id: 'open', label: 'Open', onSelect: vi.fn() }];

      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open removable menu
          </button>
          <ContextMenu isOpen={isOpen} x={80} y={80} items={items} onClose={() => setIsOpen(false)} />
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open removable menu' });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument());

    trigger.remove();
    fireEvent.keyDown(screen.getByRole('menu', { name: 'Context menu' }), { key: 'Tab' });

    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: 'Context menu' })).not.toBeInTheDocument();
    });
  });

  it('returns null when closed or when there are no items', () => {
    const { rerender } = render(<ContextMenu isOpen={false} x={0} y={0} items={[]} onClose={vi.fn()} />);
    expect(screen.queryByRole('menu', { name: 'Context menu' })).not.toBeInTheDocument();

    rerender(<ContextMenu isOpen x={0} y={0} items={[]} onClose={vi.fn()} />);
    expect(screen.queryByRole('menu', { name: 'Context menu' })).not.toBeInTheDocument();
  });

  it('uses tokenized context-menu layout and item styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-context-menu');
    expect(css).toContain('min-width: 200px;');
    expect(css).toContain('max-width: 280px;');
    expect(css).toContain('border-radius: var(--radius-md);');
    expect(css).toContain('.muwi-context-menu__item');
    expect(css).toContain('min-height: 32px;');
    expect(css).toContain('padding: var(--space-1) var(--space-3);');
    expect(css).toContain('.muwi-context-menu__item[data-destructive=\'true\']');
  });
});
