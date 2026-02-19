import { fireEvent, renderHook } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useGlobalShortcuts } from './useGlobalShortcuts';

const ctrlOrMetaModifier = () =>
  navigator.platform.toUpperCase().includes('MAC') ? { metaKey: true } : { ctrlKey: true };

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('navigates back to shelf with Ctrl/Cmd+H when viewing a diary', () => {
    useAppStore.setState(
      {
        currentView: 'diary',
        activeDiary: 'drafts',
        activeItemId: 'draft-1',
      },
      false
    );

    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'h', ...ctrlOrMetaModifier() });

    const state = useAppStore.getState();
    expect(state.currentView).toBe('shelf');
    expect(state.activeDiary).toBeNull();
    expect(state.activeItemId).toBeNull();
  });

  it('opens settings with Ctrl/Cmd+, when closed', () => {
    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: ',', ...ctrlOrMetaModifier() });

    expect(useAppStore.getState().isSettingsOpen).toBe(true);
  });

  it('opens command palette with Ctrl/Cmd+K', () => {
    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'k', ...ctrlOrMetaModifier() });

    expect(useAppStore.getState().isCommandPaletteOpen).toBe(true);
  });

  it('escape closes settings when settings are open', () => {
    useAppStore.setState(
      { currentView: 'diary', activeDiary: 'scratchpad', isSettingsOpen: true },
      false
    );

    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useAppStore.getState().isSettingsOpen).toBe(false);
    expect(useAppStore.getState().currentView).toBe('diary');
  });

  it('escape closes command palette before other overlays', () => {
    useAppStore.setState(
      {
        currentView: 'diary',
        activeDiary: 'scratchpad',
        isSettingsOpen: true,
        isCommandPaletteOpen: true,
      },
      false
    );

    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'Escape' });

    const state = useAppStore.getState();
    expect(state.isCommandPaletteOpen).toBe(false);
    expect(state.isSettingsOpen).toBe(true);
  });

  it('escape returns to shelf when in diary and settings are closed', () => {
    useAppStore.setState(
      { currentView: 'diary', activeDiary: 'scratchpad', isSettingsOpen: false },
      false
    );

    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useAppStore.getState().currentView).toBe('shelf');
  });
});
