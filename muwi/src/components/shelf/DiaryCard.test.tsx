import { fireEvent, render, screen } from '@/test';
import { DiaryCard } from './DiaryCard';

describe('DiaryCard', () => {
  it('displays diary name, icon, and metadata', () => {
    render(<DiaryCard type="drafts" onClick={vi.fn()} metadata="7 drafts · 2 days ago" />);

    const button = screen.getByRole('button', { name: 'Open Drafts' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('7 drafts · 2 days ago')).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('triggers click and right-click callbacks', () => {
    const onClick = vi.fn();
    const onContextMenu = vi.fn();
    render(
      <DiaryCard
        type="scratchpad"
        onClick={onClick}
        onContextMenu={onContextMenu}
        metadata="No entries yet"
      />
    );

    const button = screen.getByRole('button', { name: 'Open Scratchpad' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith('scratchpad');

    fireEvent.contextMenu(button, { clientX: 90, clientY: 140 });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu.mock.calls[0][1]).toBe('scratchpad');
  });

  it('supports grid, list, and shelf layout modes with selected state', () => {
    const { rerender } = render(
      <DiaryCard type="academic" onClick={vi.fn()} layout="grid" metadata="3 papers · 1 day ago" />
    );
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toHaveAttribute(
      'data-layout',
      'grid'
    );

    rerender(<DiaryCard type="academic" onClick={vi.fn()} layout="list" metadata="3 papers · 1 day ago" />);
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toHaveAttribute(
      'data-layout',
      'list'
    );

    rerender(
      <DiaryCard
        type="academic"
        onClick={vi.fn()}
        layout="shelf"
        metadata="3 papers · 1 day ago"
        isSelected
      />
    );
    const button = screen.getByRole('button', { name: 'Open Academic Papers' });
    expect(button).toHaveAttribute(
      'data-layout',
      'shelf'
    );
    expect(button).toHaveAttribute('data-selected', 'true');
  });
});
