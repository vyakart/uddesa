import { useEffect } from 'react';
import {
  useAppStore,
  selectCurrentView,
  selectActiveDiary,
  selectActiveItemId,
} from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGlobalShortcuts } from '@/hooks';
import { Shelf } from '@/components/shelf';
import { ErrorBoundary } from '@/components/common';
import { PersonalDiary } from '@/components/diaries/PersonalDiary';
import { Blackboard } from '@/components/diaries/blackboard';
import { Scratchpad } from '@/components/diaries/scratchpad';
import { Drafts } from '@/components/diaries/drafts';
import { LongDrafts } from '@/components/diaries/long-drafts';
import { Academic } from '@/components/diaries/academic';
import { buildPathFromState, parseAppRoute, routeMatchesState } from '@/utils/appRouter';

function App() {
  const currentView = useAppStore(selectCurrentView);
  const activeDiary = useAppStore(selectActiveDiary);
  const activeItemId = useAppStore(selectActiveItemId);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Load settings on mount
  useEffect(() => {
    if (!isSettingsLoaded) {
      loadSettings();
    }
  }, [isSettingsLoaded, loadSettings]);

  // Sync store state from URL on first load and browser history navigation.
  useEffect(() => {
    const syncFromPath = () => {
      const route = parseAppRoute(window.location.pathname);
      const state = useAppStore.getState();

      if (routeMatchesState(route, state)) {
        return;
      }

      if (route.view === 'shelf') {
        state.closeDiary();
        return;
      }

      state.openDiary(route.diaryType, route.itemId);
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);

    return () => {
      window.removeEventListener('popstate', syncFromPath);
    };
  }, []);

  // Sync URL when store-based navigation changes.
  useEffect(() => {
    const targetPath = buildPathFromState(currentView, activeDiary, activeItemId);
    if (window.location.pathname === targetPath) {
      return;
    }

    window.history.pushState({}, '', targetPath);
  }, [currentView, activeDiary, activeItemId]);

  // Show loading state while settings load
  if (!isSettingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'shelf' || !activeDiary) {
    return <Shelf />;
  }

  // Render the appropriate diary component wrapped in ErrorBoundary
  const renderDiary = () => {
    switch (activeDiary) {
      case 'scratchpad':
        return <Scratchpad />;
      case 'blackboard':
        return <Blackboard />;
      case 'personal-diary':
        return <PersonalDiary />;
      case 'drafts':
        return <Drafts />;
      case 'long-drafts':
        return <LongDrafts />;
      case 'academic':
        return <Academic />;
      default:
        return <Shelf />;
    }
  };

  return <ErrorBoundary key={activeDiary}>{renderDiary()}</ErrorBoundary>;
}

export default App;
