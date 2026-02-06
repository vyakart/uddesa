import type { AppState } from '@/stores/appStore';
import {
  buildDiaryPath,
  buildPathFromState,
  parseAppRoute,
  routeMatchesState,
} from './appRouter';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    currentView: 'shelf',
    activeDiary: null,
    activeItemId: null,
    isLoading: false,
    error: null,
    isSidebarOpen: false,
    contextMenu: null,
    isSettingsOpen: false,
    isAppLocked: false,
    lastActivity: 0,
    setCurrentView: vi.fn(),
    openDiary: vi.fn(),
    closeDiary: vi.fn(),
    setActiveItem: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    openSidebar: vi.fn(),
    closeSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
    openContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    lockApp: vi.fn(),
    unlockApp: vi.fn(),
    updateLastActivity: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

describe('appRouter helpers', () => {
  it('parses shelf and diary routes including optional item id', () => {
    expect(parseAppRoute('/')).toEqual({ view: 'shelf' });
    expect(parseAppRoute('/personal-diary')).toEqual({
      view: 'diary',
      diaryType: 'personal-diary',
    });
    expect(parseAppRoute('/drafts/draft-123')).toEqual({
      view: 'diary',
      diaryType: 'drafts',
      itemId: 'draft-123',
    });
    expect(parseAppRoute('/not-a-route')).toEqual({ view: 'shelf' });
  });

  it('builds paths from diary and app state', () => {
    expect(buildDiaryPath('drafts')).toBe('/drafts');
    expect(buildDiaryPath('drafts', 'draft 1')).toBe('/drafts/draft%201');
    expect(buildPathFromState('diary', 'academic', 'paper-a')).toBe('/academic/paper-a');
    expect(buildPathFromState('shelf', null, null)).toBe('/');
  });

  it('checks whether a route already matches current app state', () => {
    const shelfState = makeState();
    const diaryState = makeState({
      currentView: 'diary',
      activeDiary: 'drafts',
      activeItemId: 'draft-123',
    });

    expect(routeMatchesState({ view: 'shelf' }, shelfState)).toBe(true);
    expect(
      routeMatchesState(
        { view: 'diary', diaryType: 'drafts', itemId: 'draft-123' },
        diaryState
      )
    ).toBe(true);
    expect(
      routeMatchesState(
        { view: 'diary', diaryType: 'drafts', itemId: 'different' },
        diaryState
      )
    ).toBe(false);
  });
});
