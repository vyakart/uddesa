import { fireEvent, render, screen, waitFor } from '@/test';
import { format } from 'date-fns';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { DiaryEntry } from '@/types';
import { PersonalDiary } from './PersonalDiary';

vi.mock('./EntryNavigation', () => ({
  EntryNavigation: () => <aside data-testid="entry-navigation" />,
}));

vi.mock('./DiaryEntry', () => ({
  DiaryEntry: ({ entry }: { entry: DiaryEntry | null }) => (
    <section data-testid="diary-entry-view">{entry?.id ?? 'none'}</section>
  ),
}));

function makeEntry(): DiaryEntry {
  const now = new Date('2026-02-06T10:00:00.000Z');
  return {
    id: 'entry-today',
    date: '2026-02-06',
    content: '<p>Today</p>',
    wordCount: 1,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
  };
}

describe('PersonalDiary', () => {
  beforeEach(() => {
    const baseState = usePersonalDiaryStore.getInitialState();
    usePersonalDiaryStore.setState(baseState, true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('loads entries on mount and renders sidebar, toolbar, canvas, and status slots', async () => {
    const entry = makeEntry();
    const loadEntries = vi.fn().mockResolvedValue(undefined);
    const loadEntry = vi.fn().mockImplementation(async () => {
      usePersonalDiaryStore.setState({ currentEntry: entry, entries: [entry] });
    });

    usePersonalDiaryStore.setState({
      loadEntries,
      loadEntry,
      updateEntry: vi.fn().mockResolvedValue(undefined),
      entries: [entry],
      currentEntry: entry,
    });

    render(<PersonalDiary />);

    await waitFor(() => {
      expect(loadEntries).toHaveBeenCalledTimes(1);
      expect(loadEntry).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('entry-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('personal-diary-toolbar')).toHaveTextContent('New Entry');
    expect(screen.getByTestId('diary-entry-view')).toHaveTextContent('entry-today');
    expect(screen.getByText('1 entry')).toBeInTheDocument();
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('applies paper background settings to container', async () => {
    usePersonalDiaryStore.setState({
      entries: [makeEntry()],
      currentEntry: makeEntry(),
      loadEntries: vi.fn().mockResolvedValue(undefined),
      loadEntry: vi.fn().mockResolvedValue(undefined),
      updateEntry: vi.fn().mockResolvedValue(undefined),
    });

    useSettingsStore.setState((state) => ({
      personalDiary: {
        ...state.personalDiary,
        paperColor: '#fefefe',
        paperTexture: 'paper-white',
      },
    }));

    render(<PersonalDiary />);

    await waitFor(() => {
      expect(screen.getByTestId('personal-diary-container')).toBeInTheDocument();
    });

    const containerStyle = screen.getByTestId('personal-diary-container').getAttribute('style');
    expect(containerStyle).toContain('radial-gradient');
    expect(containerStyle).toContain('rgb(254, 254, 254)');
  });

  it('handles Ctrl+N new entry creation and PageUp/PageDown navigation shortcuts', async () => {
    const current = makeEntry();
    const nextExisting: DiaryEntry = {
      ...makeEntry(),
      id: 'entry-next',
      date: '2026-02-07',
    };

    const loadEntries = vi.fn().mockResolvedValue(undefined);
    const loadEntry = vi.fn().mockResolvedValue(undefined);

    usePersonalDiaryStore.setState({
      entries: [current, nextExisting],
      currentEntry: current,
      loadEntries,
      loadEntry,
      updateEntry: vi.fn().mockResolvedValue(undefined),
    });

    render(<PersonalDiary />);

    await waitFor(() => {
      expect(loadEntries).toHaveBeenCalledTimes(1);
      expect(loadEntry).toHaveBeenCalled();
    });

    loadEntry.mockClear();

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'PageUp' });
    fireEvent.keyDown(window, { key: 'PageDown' });

    expect(loadEntry).toHaveBeenCalledTimes(3);
    expect(format(loadEntry.mock.calls[0][0] as Date, 'yyyy-MM-dd')).toBe('2026-02-08');
    expect(format(loadEntry.mock.calls[1][0] as Date, 'yyyy-MM-dd')).toBe('2026-02-05');
    expect(format(loadEntry.mock.calls[2][0] as Date, 'yyyy-MM-dd')).toBe('2026-02-07');
  });
});
