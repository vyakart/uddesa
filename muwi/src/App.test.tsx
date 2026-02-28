import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import * as storageHealth from '@/utils/storageHealth';
import App from './App';

vi.mock('@/components/shelf', () => ({
  Shelf: () => <div data-testid="shelf-view">Shelf</div>,
}));

vi.mock('@/components/diaries/PersonalDiary/PersonalDiary', () => ({
  PersonalDiary: () => <div data-testid="personal-diary-view">Personal Diary</div>,
}));

vi.mock('@/components/diaries/blackboard', () => ({
  Blackboard: () => <div data-testid="blackboard-view">Blackboard</div>,
}));

vi.mock('@/components/diaries/scratchpad', () => ({
  Scratchpad: () => <div data-testid="scratchpad-view">Scratchpad</div>,
}));

vi.mock('@/components/diaries/drafts', () => ({
  Drafts: () => <div data-testid="drafts-view">Drafts</div>,
}));

vi.mock('@/components/diaries/long-drafts', () => ({
  LongDrafts: () => <div data-testid="long-drafts-view">Long Drafts</div>,
}));

vi.mock('@/components/diaries/academic', () => ({
  Academic: () => <div data-testid="academic-view">Academic</div>,
}));

vi.mock('@/components/common/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette-view">Command Palette</div>,
}));

describe('App routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState({
      ...useSettingsStore.getInitialState(),
      isLoaded: true,
      loadSettings: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('supports deep linking to personal diary route', async () => {
    window.history.replaceState({}, '', '/personal-diary');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('personal-diary-view')).toBeInTheDocument();
    });

    expect(useAppStore.getState().activeDiary).toBe('personal-diary');
    expect(window.location.pathname).toBe('/personal-diary');
  });

  it('syncs URL when store navigation changes including item route params', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    act(() => {
      useAppStore.getState().openDiary('drafts', 'draft-55');
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/drafts/draft-55');
      expect(screen.getByTestId('drafts-view')).toBeInTheDocument();
    });

    act(() => {
      useAppStore.getState().closeDiary();
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
      expect(screen.getByTestId('shelf-view')).toBeInTheDocument();
    });
  });

  it('updates store state on popstate navigation', async () => {
    window.history.replaceState({}, '', '/drafts/doc-a');
    render(<App />);

    await waitFor(() => {
      expect(useAppStore.getState().activeDiary).toBe('drafts');
    });

    act(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await waitFor(() => {
      expect(useAppStore.getState().currentView).toBe('shelf');
      expect(screen.getByTestId('shelf-view')).toBeInTheDocument();
    });
  });

  it('handles Ctrl+H shortcut to return home', async () => {
    window.history.replaceState({}, '', '/drafts');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('drafts-view')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'h', ctrlKey: true });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
      expect(screen.getByTestId('shelf-view')).toBeInTheDocument();
    });
  });

  it('renders a non-fatal startup warning banner and allows dismissing it', async () => {
    useSettingsStore.setState({
      ...useSettingsStore.getInitialState(),
      isLoaded: true,
      startupWarning: 'Settings failed to load (test). Using defaults for this session.',
      clearStartupWarning: vi.fn(() => {
        useSettingsStore.setState({ startupWarning: null });
      }),
      loadSettings: vi.fn().mockResolvedValue(undefined),
    });

    render(<App />);

    expect(screen.getByTestId('app-warning-banner')).toBeInTheDocument();
    expect(screen.getByText(/Settings failed to load/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(screen.queryByTestId('app-warning-banner')).not.toBeInTheDocument();
    });
  });

  it('shows loading UI and calls loadSettings when settings are not yet loaded', async () => {
    const loadSettings = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({
      ...useSettingsStore.getInitialState(),
      isLoaded: false,
      loadSettings,
    });

    render(<App />);

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    await waitFor(() => {
      expect(loadSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('renders offline banner and removes it after online event', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    render(<App />);
    expect(screen.getByTestId('app-offline-banner')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('app-offline-banner')).not.toBeInTheDocument();
    });
  });

  it('loads command palette lazily after first open and renders additional diary routes', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    act(() => {
      useAppStore.setState({ isCommandPaletteOpen: true }, false);
    });
    await waitFor(() => {
      expect(screen.getByTestId('command-palette-view')).toBeInTheDocument();
    });

    act(() => {
      useAppStore.setState({ isCommandPaletteOpen: false }, false);
    });
    await waitFor(() => {
      expect(screen.getByTestId('command-palette-view')).toBeInTheDocument();
    });

    for (const [diary, testId] of [
      ['scratchpad', 'scratchpad-view'],
      ['blackboard', 'blackboard-view'],
      ['long-drafts', 'long-drafts-view'],
      ['academic', 'academic-view'],
    ] as const) {
      act(() => {
        useAppStore.getState().openDiary(diary);
      });

      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    }
  });

  it('shows storage-only warning message without startup dismiss action', async () => {
    vi.spyOn(storageHealth, 'getStorageHealthStatus').mockResolvedValue({
      available: true,
      lowHeadroom: true,
      quotaBytes: 100,
      usageBytes: 95,
      remainingBytes: 5,
    });
    vi.spyOn(storageHealth, 'formatStorageWarning').mockReturnValue(
      'Storage warning only (test).'
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-warning-banner')).toBeInTheDocument();
      expect(screen.getByText('Storage warning only (test).')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });
});
