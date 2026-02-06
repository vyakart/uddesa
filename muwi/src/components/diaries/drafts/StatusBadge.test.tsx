import { fireEvent, render, screen } from '@/test';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('shows status text with mapped color styling', () => {
    render(<StatusBadge status="review" />);

    const badge = screen.getByRole('button', { name: /Review/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      backgroundColor: '#DBEAFE',
      color: '#1D4ED8',
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
});
