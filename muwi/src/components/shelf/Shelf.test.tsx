import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Shelf } from './Shelf';

describe('Shelf', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('displays all six diary cards', () => {
    render(<Shelf />);

    expect(screen.getByRole('button', { name: 'Open Scratchpad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Blackboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Personal Diary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Drafts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Long Drafts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Academic Papers' })).toBeInTheDocument();
  });

  it('switches layout between grid, list, and shelf', () => {
    const { rerender } = render(<Shelf />);
    const layout = screen.getByTestId('shelf-layout');
    expect(layout).toHaveAttribute('data-layout', 'grid');

    act(() => {
      useSettingsStore.setState((state) => ({
        global: { ...state.global, shelfLayout: 'list' },
      }));
    });
    rerender(<Shelf />);
    expect(screen.getByTestId('shelf-layout')).toHaveAttribute('data-layout', 'list');

    act(() => {
      useSettingsStore.setState((state) => ({
        global: { ...state.global, shelfLayout: 'shelf' },
      }));
    });
    rerender(<Shelf />);
    expect(screen.getByTestId('shelf-layout')).toHaveAttribute('data-layout', 'shelf');
  });

  it('opens settings from header button', () => {
    render(<Shelf />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(useAppStore.getState().isSettingsOpen).toBe(true);
  });

  it('persists settings after closing and reopening modal', async () => {
    render(<Shelf />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), {
      target: { value: 'dark' },
    });

    await waitFor(() => {
      expect(useSettingsStore.getState().global.theme).toBe('dark');
    });

    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'));
    expect(useAppStore.getState().isSettingsOpen).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const themeSelect = screen.getByRole('combobox', { name: 'Theme' }) as HTMLSelectElement;
    expect(themeSelect.value).toBe('dark');
  });

  it('navigates to diary on card click', () => {
    render(<Shelf />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Drafts' }));

    const app = useAppStore.getState();
    expect(app.currentView).toBe('diary');
    expect(app.activeDiary).toBe('drafts');
  });

  it('shows context menu on right-click and opens selected diary', () => {
    render(<Shelf />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Open Scratchpad' }), {
      clientX: 120,
      clientY: 140,
    });

    expect(screen.getByRole('menu', { name: 'Context menu' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open Diary' }));

    const app = useAppStore.getState();
    expect(app.currentView).toBe('diary');
    expect(app.activeDiary).toBe('scratchpad');
  });
});
