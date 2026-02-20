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

  it('toggles sidebar with Ctrl/Cmd+B outside editable content', () => {
    useAppStore.setState({ currentView: 'diary', activeDiary: 'drafts', isSidebarOpen: true }, false);
    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: 'b', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().isSidebarOpen).toBe(false);

    fireEvent.keyDown(window, { key: 'b', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().isSidebarOpen).toBe(true);
  });

  it('does not run sidebar or diary-switch shortcuts while editing content', () => {
    useAppStore.setState({ currentView: 'diary', activeDiary: 'drafts', isSidebarOpen: true }, false);
    renderHook(() => useGlobalShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'b', ...ctrlOrMetaModifier() });
    fireEvent.keyDown(input, { key: '1', ...ctrlOrMetaModifier() });

    const state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(true);
    expect(state.activeDiary).toBe('drafts');

    input.remove();
  });

  it('supports Ctrl/Cmd+1-6 diary navigation', () => {
    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: '1', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('scratchpad');

    fireEvent.keyDown(window, { key: '2', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('blackboard');

    fireEvent.keyDown(window, { key: '3', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('personal-diary');

    fireEvent.keyDown(window, { key: '4', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('drafts');

    fireEvent.keyDown(window, { key: '5', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('long-drafts');

    fireEvent.keyDown(window, { key: '6', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBe('academic');
  });

  it('does not switch diaries while settings overlay is open', () => {
    useAppStore.setState({ isSettingsOpen: true }, false);
    renderHook(() => useGlobalShortcuts());

    fireEvent.keyDown(window, { key: '1', ...ctrlOrMetaModifier() });
    expect(useAppStore.getState().activeDiary).toBeNull();
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

  it('does not close diary when a non-settings modal dialog is open', () => {
    useAppStore.setState(
      { currentView: 'diary', activeDiary: 'scratchpad', isSettingsOpen: false, isCommandPaletteOpen: false },
      false
    );

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);

    renderHook(() => useGlobalShortcuts());
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useAppStore.getState().currentView).toBe('diary');
    dialog.remove();
  });
});
