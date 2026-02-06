import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { createMockStore, createStoreResetter, resetAllStores, storeResetters } from './store-utils';

describe('store-utils', () => {
  afterEach(() => {
    resetAllStores();
  });

  it('creates a simple mock store with state updates and reset', () => {
    const store = createMockStore({ value: 1, label: 'initial' });

    store.setState({ value: 2 });
    expect(store.getState()).toEqual({ value: 2, label: 'initial' });

    store.reset();
    expect(store.getState()).toEqual({ value: 1, label: 'initial' });
  });

  it('creates a resetter that restores a store to its initial state', () => {
    const store = createMockStore({ count: 0 });
    const reset = createStoreResetter(store);

    store.setState({ count: 5 });
    expect(store.getState().count).toBe(5);

    reset();
    expect(store.getState().count).toBe(0);
  });

  it('resets registered zustand stores', () => {
    useAppStore.setState({
      currentView: 'diary',
      activeDiary: 'drafts',
      isSettingsOpen: true,
    });

    const currentGlobal = useSettingsStore.getState().global;
    useSettingsStore.setState({
      isLoaded: true,
      global: {
        ...currentGlobal,
        theme: 'dark',
      },
    });

    expect(useAppStore.getState().currentView).toBe('diary');
    expect(useSettingsStore.getState().global.theme).toBe('dark');

    resetAllStores();

    expect(useAppStore.getState().currentView).toBe('shelf');
    expect(useAppStore.getState().activeDiary).toBeNull();
    expect(useAppStore.getState().isSettingsOpen).toBe(false);
    expect(useSettingsStore.getState().isLoaded).toBe(false);
    expect(useSettingsStore.getState().global.theme).toBe('system');
  });

  it('registers resetters for project stores', () => {
    expect(storeResetters.length).toBeGreaterThanOrEqual(8);
  });
});
