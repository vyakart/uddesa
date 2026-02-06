import { useAcademicStore } from '@/stores/academicStore';
import { useAppStore } from '@/stores/appStore';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { useDraftsStore } from '@/stores/draftsStore';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useSettingsStore } from '@/stores/settingsStore';

type StoreState<T extends object> = {
  getState: () => T;
  setState: (state: T | Partial<T> | ((currentState: T) => T | Partial<T>), replace?: boolean) => void;
  getInitialState?: () => T;
};

// Generic store reset utility that works with Zustand stores and mock stores.
export function createStoreResetter<T extends object>(store: StoreState<T>) {
  const fallbackInitialState = store.getState();
  const getInitialState = store.getInitialState ?? (() => fallbackInitialState);

  return () => {
    store.setState(getInitialState(), true);
  };
}

const registeredStores: StoreState<object>[] = [
  useAppStore as unknown as StoreState<object>,
  useSettingsStore as unknown as StoreState<object>,
  useScratchpadStore as unknown as StoreState<object>,
  usePersonalDiaryStore as unknown as StoreState<object>,
  useDraftsStore as unknown as StoreState<object>,
  useBlackboardStore as unknown as StoreState<object>,
  useLongDraftsStore as unknown as StoreState<object>,
  useAcademicStore as unknown as StoreState<object>,
];

export const storeResetters: (() => void)[] = registeredStores.map((store) => createStoreResetter(store));

// Reset all registered stores to their initial state.
export function resetAllStores() {
  storeResetters.forEach((reset) => reset());
}

// Mock store creator for testing utility functions.
export function createMockStore<T extends object>(initialState: T): StoreState<T> & { subscribe: () => () => void; reset: () => void } {
  let state = { ...initialState };

  return {
    getState: () => state,
    setState: (nextState) => {
      if (typeof nextState === 'function') {
        const resolved = nextState(state);
        state = { ...state, ...resolved };
        return;
      }
      state = { ...state, ...nextState };
    },
    subscribe: () => () => {},
    getInitialState: () => ({ ...initialState }),
    reset: () => {
      state = { ...initialState };
    },
  };
}
