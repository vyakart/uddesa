// Store utilities for testing
// These utilities will help reset and mock stores during tests

// Generic store reset utility
export function createStoreResetter<T>(useStore: { getState: () => T; setState: (state: Partial<T>) => void }) {
  const initialState = useStore.getState();

  return () => {
    useStore.setState(initialState);
  };
}

// Will be populated with actual store resetters when stores are created
export const storeResetters: (() => void)[] = [];

// Reset all stores to their initial state
export function resetAllStores() {
  storeResetters.forEach((reset) => reset());
}

// Mock store creator for testing
export function createMockStore<T extends object>(initialState: T) {
  let state = { ...initialState };

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
    },
    subscribe: () => () => {},
    reset: () => {
      state = { ...initialState };
    },
  };
}
