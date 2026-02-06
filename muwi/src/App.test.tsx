import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import App from './App';

vi.mock('@/components/shelf', () => ({
  Shelf: () => <div data-testid="shelf-view">Shelf</div>,
}));

vi.mock('@/components/diaries/PersonalDiary', () => ({
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

describe('App routing', () => {
  beforeEach(() => {
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
});
