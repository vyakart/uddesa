import { fireEvent, render, screen } from '@/test';
import { useSettingsStore } from '@/stores/settingsStore';
import { CategoryPicker } from './CategoryPicker';

describe('CategoryPicker', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('shows current category with color and lists all categories', () => {
    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor="#112233"
        onCategoryChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: /Ideas/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector('span[style]')).toHaveAttribute(
      'style',
      expect.stringContaining('--muwi-category-swatch: #112233')
    );

    fireEvent.click(trigger);
    expect(screen.getAllByRole('menuitemradio', { name: /Ideas/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('menuitemradio', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /Notes/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /Questions/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /Misc/i })).toBeInTheDocument();
  });

  it('uses settings colors and reports selected category', () => {
    const onCategoryChange = vi.fn();
    useSettingsStore.setState((state) => ({
      scratchpad: {
        ...state.scratchpad,
        categories: {
          ...state.scratchpad.categories,
          todos: '#010203',
        },
      },
    }));

    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor="#112233"
        onCategoryChange={onCategoryChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Ideas/i }));
    const todosOption = screen.getByRole('menuitemradio', { name: /Todos/i });
    expect(todosOption.querySelector('span[style]')).toHaveAttribute(
      'style',
      expect.stringContaining('--muwi-category-swatch: #010203')
    );

    fireEvent.click(todosOption);
    expect(onCategoryChange).toHaveBeenCalledWith('todos');
  });
});
