import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { db } from '@/db/database';
import { Shelf } from './Shelf';

describe('Shelf', () => {
  beforeEach(async () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);

    await Promise.all([
      db.scratchpadPages.clear(),
      db.blackboardCanvases.clear(),
      db.diaryEntries.clear(),
      db.drafts.clear(),
      db.longDrafts.clear(),
      db.academicPapers.clear(),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays all six diary cards and command palette hint', () => {
    render(<Shelf />);

    const cards = [
      screen.getByRole('button', { name: 'Open Scratchpad' }),
      screen.getByRole('button', { name: 'Open Blackboard' }),
      screen.getByRole('button', { name: 'Open Personal Diary' }),
      screen.getByRole('button', { name: 'Open Drafts' }),
      screen.getByRole('button', { name: 'Open Long Drafts' }),
      screen.getByRole('button', { name: 'Open Academic Papers' }),
    ];

    cards.forEach((card) => {
      expect(card.querySelector('svg')).toBeInTheDocument();
    });

    expect(screen.getByText('⌘K to open command palette')).toBeInTheDocument();
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

  it('loads metadata from real diary counts and relative timestamps', async () => {
    await db.drafts.add({
      id: 'draft-1',
      title: 'Draft One',
      content: '<p>Body</p>',
      status: 'in-progress',
      wordCount: 2,
      tags: [],
      isLocked: false,
      createdAt: new Date('2026-02-16T09:30:00.000Z'),
      modifiedAt: new Date('2026-02-18T09:30:00.000Z'),
    });

    render(<Shelf />);

    await waitFor(() => {
      expect(screen.getByText(/1 draft · /i)).toBeInTheDocument();
    });
    expect(screen.getAllByText('No entries yet').length).toBeGreaterThan(0);
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

  it('navigates to diary after transition delay on card click', () => {
    vi.useFakeTimers();
    render(<Shelf />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Drafts' }));

    expect(useAppStore.getState().currentView).toBe('shelf');

    act(() => {
      vi.advanceTimersByTime(230);
    });

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

  it('highlights last opened diary for two seconds after returning to shelf', () => {
    vi.useFakeTimers();
    useAppStore.setState({ currentView: 'diary', activeDiary: 'drafts' });

    const { rerender } = render(<Shelf />);

    act(() => {
      useAppStore.getState().closeDiary();
    });

    rerender(<Shelf />);

    expect(screen.getByRole('button', { name: 'Open Drafts' })).toHaveAttribute('data-selected', 'true');

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(useAppStore.getState().lastOpenedDiary).toBeNull();
  });
});
