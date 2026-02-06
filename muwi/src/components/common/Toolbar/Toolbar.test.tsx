import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@/test';
import { Toolbar, type ToolbarItem } from './Toolbar';

describe('Toolbar', () => {
  it('renders in horizontal layout with separators and tooltips', () => {
    const items: ToolbarItem[] = [
      { id: 'bold', label: 'Bold', onClick: vi.fn(), tooltip: 'Bold text', toggle: true, isActive: true },
      { id: 'sep-1', type: 'separator' },
      { id: 'italic', label: 'Italic', onClick: vi.fn(), tooltip: 'Italic text' },
    ];

    render(<Toolbar items={items} ariaLabel="Formatting toolbar" />);

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' });
    expect(toolbar).toHaveStyle({ display: 'flex', flexDirection: 'row' });
    expect(screen.getAllByRole('separator')).toHaveLength(1);

    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('title', 'Bold text');
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(bold).toHaveAttribute('data-active', 'true');
  });

  it('handles click actions and keyboard arrow navigation', async () => {
    const firstClick = vi.fn();
    const secondClick = vi.fn();
    const user = userEvent.setup();

    const items: ToolbarItem[] = [
      { id: 'first', label: 'First', onClick: firstClick },
      { id: 'second', label: 'Second', onClick: secondClick },
    ];

    render(<Toolbar items={items} />);

    const toolbar = screen.getByRole('toolbar');
    const firstButton = screen.getByRole('button', { name: 'First' });
    const secondButton = screen.getByRole('button', { name: 'Second' });

    firstButton.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(secondButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(secondClick).toHaveBeenCalledTimes(1);

    await user.click(firstButton);
    expect(firstClick).toHaveBeenCalledTimes(1);
  });
});
