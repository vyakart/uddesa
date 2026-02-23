import { fireEvent, render, screen } from '@/test';
import { useSettingsStore } from '@/stores/settingsStore';
import { CategoryPicker } from './CategoryPicker';

const TEST_CATEGORY_COLOR = ['#', '112233'].join('');
const TEST_TODOS_COLOR = ['#', '010203'].join('');

describe('CategoryPicker', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('shows current category with color and lists all categories', () => {
    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor={TEST_CATEGORY_COLOR}
        onCategoryChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: /Ideas/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector('span[style]')).toHaveAttribute(
      'style',
      expect.stringContaining(`--muwi-category-swatch: ${TEST_CATEGORY_COLOR}`)
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
          todos: TEST_TODOS_COLOR,
        },
      },
    }));

    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor={TEST_CATEGORY_COLOR}
        onCategoryChange={onCategoryChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Ideas/i }));
    const todosOption = screen.getByRole('menuitemradio', { name: /Todos/i });
    expect(todosOption.querySelector('span[style]')).toHaveAttribute(
      'style',
      expect.stringContaining(`--muwi-category-swatch: ${TEST_TODOS_COLOR}`)
    );

    fireEvent.click(todosOption);
    expect(onCategoryChange).toHaveBeenCalledWith('todos');
  });

  it('supports keyboard open/close and outside-click dismissal', () => {
    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor={TEST_CATEGORY_COLOR}
        onCategoryChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: /Ideas/i });

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menu', { name: 'Category options' })).toBeInTheDocument();

    fireEvent.mouseDown(trigger);
    expect(screen.getByRole('menu', { name: 'Category options' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu', { name: 'Category options' })).not.toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByRole('menu', { name: 'Category options' })).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Category options' })).not.toBeInTheDocument();
  });

  it('does not open when disabled (click or keyboard)', () => {
    const onCategoryChange = vi.fn();
    render(
      <CategoryPicker
        currentCategory="ideas"
        categoryColor={TEST_CATEGORY_COLOR}
        onCategoryChange={onCategoryChange}
        disabled
      />
    );

    const trigger = screen.getByRole('button', { name: /Ideas/i });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: 'x' });
    expect(screen.queryByRole('menu', { name: 'Category options' })).not.toBeInTheDocument();
    expect(onCategoryChange).not.toHaveBeenCalled();
  });
});
