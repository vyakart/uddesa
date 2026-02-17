import { fireEvent, render, screen, setupUser } from '@/test';
import { FontSelector } from './FontSelector';

const FONTS = ['Inter', 'Caveat', 'JetBrains Mono'];

describe('FontSelector', () => {
  it('renders available fonts in select variant with preview styles', () => {
    render(<FontSelector fonts={FONTS} value="Inter" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox', { name: 'Font' });
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(FONTS);
    expect(options[1]).toHaveStyle({ fontFamily: "'Caveat', var(--font-family-sans), sans-serif" });
  });

  it('calls onChange when a new font is selected', () => {
    const onChange = vi.fn();
    render(<FontSelector fonts={FONTS} value="Inter" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Font' }), { target: { value: 'Caveat' } });
    expect(onChange).toHaveBeenCalledWith('Caveat');
  });

  it('renders and updates in context-menu variant', async () => {
    const user = setupUser();
    const onChange = vi.fn();
    render(
      <FontSelector
        fonts={FONTS}
        value="Inter"
        onChange={onChange}
        label="Blackboard Font"
        variant="context-menu"
      />
    );

    expect(screen.getByRole('menu', { name: 'Blackboard Font menu' })).toBeInTheDocument();
    const caveatOption = screen.getByRole('menuitemradio', { name: 'Caveat' });
    expect(caveatOption).toHaveStyle({ fontFamily: "'Caveat', var(--font-family-sans), sans-serif" });

    await user.click(caveatOption);
    expect(onChange).toHaveBeenCalledWith('Caveat');
  });
});
