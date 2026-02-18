import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@/test';
import { Toolbar, type ToolbarItem } from './Toolbar';

describe('Toolbar', () => {
  it('renders in horizontal layout with separators and tooltips', () => {
    const items: ToolbarItem[] = [
      {
        id: 'bold',
        label: 'Bold',
        onClick: vi.fn(),
        tooltip: 'Bold text',
        toggle: true,
        isActive: true,
        icon: <span data-testid="bold-icon">B</span>,
      },
      { id: 'sep-1', type: 'separator' },
      { id: 'italic', label: 'Italic', onClick: vi.fn(), tooltip: 'Italic text', showLabel: true },
    ];

    render(<Toolbar items={items} ariaLabel="Formatting toolbar" />);

    const toolbar = screen.getByRole('toolbar', { name: 'Formatting toolbar' });
    expect(toolbar).toHaveClass('muwi-toolbar');
    expect(screen.getAllByRole('separator')).toHaveLength(1);

    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('title', 'Bold text');
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(bold).toHaveAttribute('data-active', 'true');
    expect(bold).toHaveAttribute('data-icon-only', 'true');
    expect(screen.getByTestId('bold-icon')).toBeInTheDocument();

    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(italic).toHaveAttribute('data-icon-only', 'false');
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

  it('uses tokenized grouped toolbar styles with overflow support', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-toolbar');
    expect(css).toContain('min-height: var(--space-toolbar-height);');
    expect(css).toContain('overflow-x: auto;');
    expect(css).toContain('.muwi-toolbar__separator');
    expect(css).toContain('height: 16px;');
    expect(css).toContain('.muwi-toolbar__button[data-active=\'true\']:not(:disabled)');
    expect(css).toContain('background: var(--color-accent-subtle);');
    expect(css).toContain('color: var(--color-accent-default);');
  });
});
