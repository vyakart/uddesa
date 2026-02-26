import { lazy, Suspense, useEffect, useState } from 'react';
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
import { installGlobalRuntimeDiagnostics } from '@/utils/runtimeDiagnostics';
import { formatStorageWarning, getStorageHealthStatus } from '@/utils/storageHealth';

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
      className="muwi-chrome-text min-h-screen [background-color:var(--color-bg-primary)] [color:var(--color-text-secondary)]"
      role="main"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="diary-loading-status"
    >
      <p id="diary-loading-status" role="status" className="sr-only">
        Loading {diaryDisplayNames[diary]}.
      </p>

      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside
          aria-hidden="true"
          className="hidden border-r md:flex md:flex-col md:gap-3 md:px-4 md:py-4 [border-color:var(--color-border-default)] [background-color:var(--color-bg-secondary)]"
        >
          <div className="h-8 w-28 animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="mt-2 h-6 w-full animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-6 w-5/6 animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-6 w-4/5 animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="mt-4 h-6 w-full animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-6 w-3/4 animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
        </aside>

        <section className="flex min-w-0 flex-col">
          <div
            aria-hidden="true"
            className="h-11 border-b px-4 py-2 [border-color:var(--color-border-default)] [background-color:var(--color-bg-primary)]"
          >
            <div className="h-full w-40 animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
          </div>

          <div className="flex flex-1 items-start justify-center px-4 py-6 md:px-6">
            <div
              aria-hidden="true"
              className="w-full max-w-[720px] rounded-lg border p-4 shadow-sm md:p-6 [border-color:var(--color-border-default)] [background-color:var(--color-bg-canvas)]"
            >
              <div className="mb-5 h-7 w-52 animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
                <div className="h-4 w-11/12 animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
                <div className="h-4 w-10/12 animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
                <div className="h-4 w-9/12 animate-pulse rounded-md [background-color:var(--color-bg-secondary)] motion-reduce:animate-none" />
              </div>
              <p className="mt-5 [color:var(--color-text-tertiary)]">
                Loading {diaryDisplayNames[diary]}...
              </p>
            </div>
          </div>
        </section>

        <aside
          aria-hidden="true"
          className="hidden border-l xl:flex xl:flex-col xl:gap-3 xl:px-4 xl:py-4 [border-color:var(--color-border-default)] [background-color:var(--color-bg-secondary)]"
        >
          <div className="h-8 w-24 animate-pulse rounded-md [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-20 w-full animate-pulse rounded-lg [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-20 w-full animate-pulse rounded-lg [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
          <div className="h-20 w-full animate-pulse rounded-lg [background-color:var(--color-bg-tertiary)] motion-reduce:animate-none" />
        </aside>
      </div>
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
  const startupWarning = useSettingsStore((state) => state.startupWarning);
  const clearStartupWarning = useSettingsStore((state) => state.clearStartupWarning);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Enable global keyboard shortcuts
  useGlobalShortcuts();
  usePasteHandler();

  useEffect(() => {
    return installGlobalRuntimeDiagnostics();
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    void getStorageHealthStatus()
      .then((status) => {
        if (cancelled) return;
        setStorageWarning(formatStorageWarning(status));
      })
      .catch((error) => {
        console.warn('Storage health estimate failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      <div className="muwi-chrome-text flex min-h-screen items-center justify-center [background-color:var(--color-bg-primary)]">
        <p role="status" aria-live="polite" className="[color:var(--color-text-tertiary)]">
          Loading settings...
        </p>
      </div>
    );
  }

  const warningBanner = startupWarning || storageWarning ? (
    <div
      role="status"
      aria-live="polite"
      className="muwi-chrome-text flex items-start justify-between gap-3 border-b px-4 py-2 text-sm [background-color:var(--color-bg-secondary)] [border-color:var(--color-border-default)] [color:var(--color-text-secondary)]"
      data-testid="app-warning-banner"
    >
      <div className="space-y-1">
        {startupWarning ? <p>{startupWarning}</p> : null}
        {storageWarning ? <p>{storageWarning}</p> : null}
      </div>
      {startupWarning ? (
        <button
          type="button"
          className="rounded px-2 py-1 text-xs [background-color:var(--color-bg-tertiary)] [color:var(--color-text-primary)]"
          onClick={clearStartupWarning}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  ) : null;

  // Render based on current view
  if (currentView === 'shelf' || !activeDiary) {
    return (
      <>
        {warningBanner}
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
      {warningBanner}
      <ErrorBoundary key={activeDiary} onNavigateHome={() => useAppStore.getState().closeDiary()}>
        <Suspense fallback={<DiaryLoadingState diary={activeDiary} />}>
          {renderDiary()}
        </Suspense>
      </ErrorBoundary>
      <CommandPalette />
    </>
  );
}

export default App;
