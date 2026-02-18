import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@/test';
import { Button } from './Button';

describe('Button', () => {
  it('renders primary variant with compact size and icon slots', () => {
    const onClick = vi.fn();

    render(
      <Button
        variant="primary"
        size="sm"
        leadingIcon={<span data-testid="leading-icon">L</span>}
        trailingIcon={<span data-testid="trailing-icon">R</span>}
        onClick={onClick}
      >
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save' });
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });

  it('applies active and disabled state markers', () => {
    render(
      <Button variant="ghost" size="md" active disabled>
        Toggle
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Toggle' });
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('data-active', 'true');
    expect(button).toBeDisabled();
  });

  it('supports prominent icon-only buttons', () => {
    render(
      <Button variant="danger" size="lg" iconOnly aria-label="Delete item">
        ×
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Delete item' });
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-icon-only', 'true');
  });

  it('uses tokenized focus and disabled button styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-button:focus-visible');
    expect(css).toContain('box-shadow: var(--shadow-focus);');
    expect(css).toContain('.muwi-button:disabled');
    expect(css).toContain('opacity: 0.5;');
    expect(css).toContain('pointer-events: none;');
  });
});
