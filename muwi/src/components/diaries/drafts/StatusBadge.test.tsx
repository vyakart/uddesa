import { fireEvent, render, screen } from '@/test';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('shows status text with mapped color styling', () => {
    render(<StatusBadge status="review" />);

    const badge = screen.getByRole('button', { name: /Review/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      backgroundColor: 'var(--color-info-subtle)',
      color: 'var(--color-info)',
    });
  });

  it('supports click handlers and disabled state', () => {
    const onClick = vi.fn();
    const { rerender } = render(<StatusBadge status="in-progress" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: /In Progress/i }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<StatusBadge status="in-progress" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button', { name: /In Progress/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies hover brightness only when clickable and supports small-size styles', () => {
    const onClick = vi.fn();
    const { rerender } = render(<StatusBadge status="complete" onClick={onClick} size="sm" />);

    const clickable = screen.getByRole('button', { name: /Complete/i });
    fireEvent.mouseEnter(clickable);
    expect(clickable).toHaveStyle({ filter: 'brightness(0.95)' });
    fireEvent.mouseLeave(clickable);
    expect(clickable).toHaveStyle({ filter: 'brightness(1)', fontSize: '11px', padding: '2px 8px' });
    expect(clickable).toHaveAttribute('title', 'Click to change status');

    rerender(<StatusBadge status="complete" />);
    const nonClickable = screen.getByRole('button', { name: /Complete/i });
    const beforeHover = nonClickable.style.filter;
    fireEvent.mouseEnter(nonClickable);
    expect(nonClickable.style.filter).toBe(beforeHover);
    fireEvent.mouseLeave(nonClickable);
    expect(nonClickable).toHaveStyle({ filter: 'brightness(1)' });
    expect(nonClickable).not.toHaveAttribute('title');
  });
});
