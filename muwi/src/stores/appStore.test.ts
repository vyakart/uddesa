import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('manages navigation and active diary state', () => {
    const state = useAppStore.getState();

    state.setCurrentView('settings');
    expect(useAppStore.getState().currentView).toBe('settings');

    state.openDiary('drafts', 'draft-1');
    expect(useAppStore.getState().currentView).toBe('diary');
    expect(useAppStore.getState().activeDiary).toBe('drafts');
    expect(useAppStore.getState().activeItemId).toBe('draft-1');

    state.setActiveItem('draft-2');
    expect(useAppStore.getState().activeItemId).toBe('draft-2');

    state.closeDiary();
    expect(useAppStore.getState().currentView).toBe('shelf');
    expect(useAppStore.getState().activeDiary).toBeNull();
    expect(useAppStore.getState().activeItemId).toBeNull();
  });

  it('manages sidebar, context menu, and settings modal state', () => {
    const state = useAppStore.getState();

    state.openSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(true);

    state.toggleSidebar();
    expect(useAppStore.getState().isSidebarOpen).toBe(false);

    state.openContextMenu(100, 200, 'item-1', 'draft');
    expect(useAppStore.getState().contextMenu).toEqual({
      isOpen: true,
      x: 100,
      y: 200,
      targetId: 'item-1',
      targetType: 'draft',
    });

    state.closeContextMenu();
    expect(useAppStore.getState().contextMenu).toBeNull();

    state.openSettings();
    expect(useAppStore.getState().isSettingsOpen).toBe(true);
    state.closeSettings();
    expect(useAppStore.getState().isSettingsOpen).toBe(false);
  });

  it('manages loading, errors, lock state, and reset', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_234_567_890);
    const state = useAppStore.getState();

    state.setLoading(true);
    state.setError('boom');
    state.lockApp();
    state.updateLastActivity();
    expect(useAppStore.getState().isLoading).toBe(true);
    expect(useAppStore.getState().error).toBe('boom');
    expect(useAppStore.getState().isAppLocked).toBe(true);
    expect(useAppStore.getState().lastActivity).toBe(1_234_567_890);

    state.unlockApp();
    expect(useAppStore.getState().isAppLocked).toBe(false);

    state.reset();
    const resetState = useAppStore.getState();
    expect(resetState.currentView).toBe('shelf');
    expect(resetState.activeDiary).toBeNull();
    expect(resetState.isLoading).toBe(false);
    expect(resetState.error).toBeNull();
    expect(resetState.isSidebarOpen).toBe(false);
    expect(resetState.contextMenu).toBeNull();
    expect(resetState.isSettingsOpen).toBe(false);
    expect(resetState.isAppLocked).toBe(false);

    nowSpy.mockRestore();
  });
});
