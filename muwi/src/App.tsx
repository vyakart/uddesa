import { lazy, Suspense, useEffect } from 'react';
import {
  useAppStore,
  selectCurrentView,
  selectActiveDiary,
  selectActiveItemId,
  type DiaryType,
} from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGlobalShortcuts, usePasteHandler } from '@/hooks';
import { applyThemeToDocument, getSystemPrefersDark, resolveTheme, watchSystemTheme } from '@/utils/theme';
import { Shelf } from '@/components/shelf';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { buildPathFromState, parseAppRoute, routeMatchesState } from '@/utils/appRouter';

const PersonalDiary = lazy(async () => {
  const module = await import('@/components/diaries/personal-diary');
  return { default: module.PersonalDiary };
});

const Blackboard = lazy(async () => {
  const module = await import('@/components/diaries/blackboard');
  return { default: module.Blackboard };
});

const Scratchpad = lazy(async () => {
  const module = await import('@/components/diaries/scratchpad');
  return { default: module.Scratchpad };
});

const Drafts = lazy(async () => {
  const module = await import('@/components/diaries/drafts');
  return { default: module.Drafts };
});

const LongDrafts = lazy(async () => {
  const module = await import('@/components/diaries/long-drafts');
  return { default: module.LongDrafts };
});

const Academic = lazy(async () => {
  const module = await import('@/components/diaries/academic');
  return { default: module.Academic };
});

const diaryDisplayNames: Record<DiaryType, string> = {
  scratchpad: 'Scratchpad',
  blackboard: 'Blackboard',
  'personal-diary': 'Personal Diary',
  drafts: 'Drafts',
  'long-drafts': 'Long Drafts',
  academic: 'Academic',
};

function DiaryLoadingState({ diary }: { diary: DiaryType }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      role="main"
      aria-busy="true"
      aria-live="polite"
      aria-label={`${diaryDisplayNames[diary]} loading`}
    >
      <p role="status" className="text-gray-500">
        Loading {diaryDisplayNames[diary]}...
      </p>
    </main>
  );
}

function App() {
  const currentView = useAppStore(selectCurrentView);
  const activeDiary = useAppStore(selectActiveDiary);
  const activeItemId = useAppStore(selectActiveItemId);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);
  const themeMode = useSettingsStore((state) => state.global.theme);

  // Enable global keyboard shortcuts
  useGlobalShortcuts();
  usePasteHandler();

  // Load settings on mount
  useEffect(() => {
    if (!isSettingsLoaded) {
      loadSettings();
    }
  }, [isSettingsLoaded, loadSettings]);

  // Apply effective theme to document root.
  useEffect(() => {
    const applyResolvedTheme = () => {
      applyThemeToDocument(resolveTheme(themeMode, getSystemPrefersDark()));
    };

    applyResolvedTheme();

    if (themeMode !== 'system') {
      return undefined;
    }

    return watchSystemTheme((theme) => {
      applyThemeToDocument(theme);
    });
  }, [themeMode]);

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
    return (
      <>
        <Shelf />
        <CommandPalette />
      </>
    );
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

  return (
    <>
      <ErrorBoundary key={activeDiary}>
        <Suspense fallback={<DiaryLoadingState diary={activeDiary} />}>
          {renderDiary()}
        </Suspense>
      </ErrorBoundary>
      <CommandPalette />
    </>
  );
}

export default App;
