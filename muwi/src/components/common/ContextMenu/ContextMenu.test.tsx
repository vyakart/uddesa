import { fireEvent, render, screen } from '@/test';
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
    expect(parseInt(menu.style.left, 10)).toBeLessThanOrEqual(72);
    expect(parseInt(menu.style.top, 10)).toBeLessThanOrEqual(8);
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
});
