import { fireEvent, render, screen } from '@/test';
import { DiaryCard } from './DiaryCard';

describe('DiaryCard', () => {
  it('displays diary name, icon, color and hover preview info', () => {
    render(
      <DiaryCard
        type="drafts"
        onClick={vi.fn()}
        itemCount={7}
        lastModified={new Date('2026-02-06T00:00:00.000Z')}
      />
    );

    const button = screen.getByRole('button', { name: 'Open Drafts' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('✏️')).toBeInTheDocument();

    const preview = screen.getByText(/7 items/i);
    expect(preview.style.opacity).toBe('0');

    fireEvent.mouseEnter(button);
    expect(preview.style.opacity).toBe('1');
  });

  it('triggers click and right-click callbacks', () => {
    const onClick = vi.fn();
    const onContextMenu = vi.fn();
    render(<DiaryCard type="scratchpad" onClick={onClick} onContextMenu={onContextMenu} />);

    const button = screen.getByRole('button', { name: 'Open Scratchpad' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith('scratchpad');

    fireEvent.contextMenu(button, { clientX: 90, clientY: 140 });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu.mock.calls[0][1]).toBe('scratchpad');
  });

  it('supports grid, list, and shelf layout modes', () => {
    const { rerender } = render(<DiaryCard type="academic" onClick={vi.fn()} layout="grid" />);
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toHaveAttribute(
      'data-layout',
      'grid'
    );

    rerender(<DiaryCard type="academic" onClick={vi.fn()} layout="list" />);
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toHaveAttribute(
      'data-layout',
      'list'
    );

    rerender(<DiaryCard type="academic" onClick={vi.fn()} layout="shelf" />);
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toHaveAttribute(
      'data-layout',
      'shelf'
    );
  });
});
