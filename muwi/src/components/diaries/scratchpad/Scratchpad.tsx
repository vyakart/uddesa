import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Lock, RefreshCcw, Unlock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import { PasskeyPrompt } from '@/components/common/PasskeyPrompt';
import { useContentLocking } from '@/hooks/useContentLocking';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ScratchpadPage } from './ScratchpadPage';
import { PageStack } from './PageStack';
import { CategoryPicker } from './CategoryPicker';
import type { CategoryName } from '@/types/scratchpad';
import { hasActiveModalDialog, isEditableTarget } from '@/utils/keyboard';

const SCRATCHPAD_CATEGORY_LABELS: Record<CategoryName, string> = {
  ideas: 'Ideas',
  todos: 'Todos',
  notes: 'Notes',
  questions: 'Questions',
  misc: 'Misc',
};

export function Scratchpad() {
  const [isInitialized, setIsInitialized] = useState(false);

  const pages = useScratchpadStore((state) => state.pages);
  const currentPageIndex = useScratchpadStore((state) => state.currentPageIndex);
  const textBlocks = useScratchpadStore((state) => state.textBlocks);
  const isLoading = useScratchpadStore((state) => state.isLoading);
  const error = useScratchpadStore((state) => state.error);
  const loadPages = useScratchpadStore((state) => state.loadPages);
  const createPage = useScratchpadStore((state) => state.createPage);
  const navigateToPage = useScratchpadStore((state) => state.navigateToPage);
  const updatePageCategory = useScratchpadStore((state) => state.updatePageCategory);
  const updatePageLock = useScratchpadStore((state) => state.updatePageLock);
  const findFreshPage = useScratchpadStore((state) => state.findFreshPage);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const passkeyHint = useSettingsStore((state) => state.global.passkeyHint);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);

  const currentPage = pages[currentPageIndex];
  const currentBlocks = currentPage ? (textBlocks.get(currentPage.id) || []) : [];
  const pageCount = pages.length;
  const currentPageNumber = currentPage ? currentPageIndex + 1 : 0;
  const currentCategoryLabel = currentPage
    ? SCRATCHPAD_CATEGORY_LABELS[currentPage.categoryName]
    : 'No category';
  const currentBlockCount = currentBlocks.length;
  const {
    lock,
    unlock,
    error: lockingError,
  } = useContentLocking({
    contentType: 'page',
    contentId: currentPage?.id ?? '',
    enabled: Boolean(currentPage?.id),
  });

  // Initialize: load pages on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadPages();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Scratchpad:', err);
        setIsInitialized(true);
      }
    };
    initialize();
  }, [loadPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasActiveModalDialog() || isEditableTarget(e.target)) {
        return;
      }

      // Ctrl+N or Cmd+N: Create new page
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createPage();
      }

      // PageUp: Previous page
      if (e.key === 'PageUp') {
        e.preventDefault();
        if (currentPageIndex > 0) {
          navigateToPage(currentPageIndex - 1);
        }
      }

      // PageDown: Next page
      if (e.key === 'PageDown') {
        e.preventDefault();
        if (currentPageIndex < pages.length - 1) {
          navigateToPage(currentPageIndex + 1);
        }
      }

      // Ctrl+F or Cmd+F: Find fresh page
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
        e.preventDefault();
        findFreshPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length, createPage, navigateToPage, findFreshPage]);

  const handleCategoryChange = useCallback(
    (category: CategoryName) => {
      if (currentPage) {
        updatePageCategory(currentPage.id, category);
      }
    },
    [currentPage, updatePageCategory]
  );

  const handleCreatePage = useCallback(() => {
    createPage();
  }, [createPage]);

  const promptPasskeySetup = useCallback(() => {
    const shouldOpenSettings = confirm('A passkey is required to lock content. Open Settings to set one now?');
    if (shouldOpenSettings) {
      closeDiary();
      openSettings();
    }
  }, [closeDiary, openSettings]);

  const handlePageLockToggle = useCallback(async () => {
    if (!currentPage) {
      return;
    }

    if (currentPage.isLocked) {
      setShowUnlockPrompt(true);
      return;
    }

    const hasPass = await hasPasskey();
    if (!hasPass) {
      promptPasskeySetup();
      return;
    }

    const didLock = await lock();
    if (didLock) {
      await updatePageLock(currentPage.id, true);
    }
  }, [currentPage, hasPasskey, lock, promptPasskeySetup, updatePageLock]);

  const handleUnlockSubmit = useCallback(async (passkey: string) => {
    if (!currentPage) {
      return;
    }

    const didUnlock = await unlock(passkey);
    if (didUnlock) {
      await updatePageLock(currentPage.id, false);
      setShowUnlockPrompt(false);
    }
  }, [currentPage, unlock, updatePageLock]);

  const toolbar = (
    <div className="muwi-scratchpad-toolbar">
      {currentPage && (
        <CategoryPicker
          currentCategory={currentPage.categoryName}
          categoryColor={currentPage.categoryColor}
          onCategoryChange={handleCategoryChange}
          disabled={currentPage.isLocked}
        />
      )}
      <div className="muwi-scratchpad-toolbar__controls" role="group" aria-label="Page controls">
        <Button
          type="button"
          onClick={() => navigateToPage(currentPageIndex - 1)}
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Previous page"
          disabled={currentPageIndex <= 0}
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </Button>
        <span className="muwi-scratchpad-toolbar__page-indicator">
          Page {currentPageNumber}/{pageCount}
        </span>
        <Button
          type="button"
          onClick={() => navigateToPage(currentPageIndex + 1)}
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Next page"
          disabled={currentPageIndex >= pageCount - 1}
        >
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          onClick={() => void findFreshPage()}
          variant="secondary"
          size="sm"
          leadingIcon={<RefreshCcw size={14} />}
        >
          Fresh Page
        </Button>
        {currentPage ? (
          <Button
            type="button"
            onClick={() => void handlePageLockToggle()}
            variant="secondary"
            size="sm"
            leadingIcon={currentPage.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            aria-label={currentPage.isLocked ? 'Unlock Page' : 'Lock Page'}
          >
            {currentPage.isLocked ? 'Unlock Page' : 'Lock Page'}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const sidebarHeader = <p className="muwi-scratchpad-sidebar__label">PAGES</p>;
  const sidebarFooter = (
    <Button
      type="button"
      onClick={handleCreatePage}
      variant="primary"
      size="md"
      className="muwi-scratchpad-sidebar__new-page"
    >
      + New Page
    </Button>
  );

  const status = {
    left: `Page ${currentPageNumber} of ${pageCount} · ${currentCategoryLabel}`,
    right: `${currentBlockCount} ${currentBlockCount === 1 ? 'block' : 'blocks'}${
      currentPage?.isLocked ? ' · Locked' : ''
    }`,
  };

  const loadingCanvas = (
    <div className="muwi-scratchpad-state" role="status" aria-live="polite">
      <p className="muwi-scratchpad-state__title">Loading scratchpad...</p>
      <p className="muwi-scratchpad-state__text">Preparing your latest pages and notes.</p>
    </div>
  );

  const errorCanvas = (
    <div className="muwi-scratchpad-state" role="alert">
      <p className="muwi-scratchpad-state__title">Scratchpad failed to load</p>
      <p className="muwi-scratchpad-state__text">{error}</p>
      <Button type="button" onClick={() => void loadPages()} variant="danger" size="md">
        Retry
      </Button>
    </div>
  );

  const emptyCanvas = (
    <div className="muwi-scratchpad-state" role="status">
      <p className="muwi-scratchpad-state__title">No page selected</p>
      <p className="muwi-scratchpad-state__text">Create a page to begin capturing ideas.</p>
      <Button type="button" onClick={handleCreatePage} variant="primary" size="md">
        + New Page
      </Button>
    </div>
  );

  if (!isInitialized || isLoading) {
    return (
      <DiaryLayout
        diaryType="scratchpad"
        sidebar={<PageStack />}
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        toolbar={toolbar}
        canvas={<div className="muwi-scratchpad-canvas">{loadingCanvas}</div>}
        status={status}
      />
    );
  }

  if (error) {
    return (
      <DiaryLayout
        diaryType="scratchpad"
        sidebar={<PageStack />}
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        toolbar={toolbar}
        canvas={<div className="muwi-scratchpad-canvas">{errorCanvas}</div>}
        status={status}
      />
    );
  }

  return (
    <>
      <DiaryLayout
        diaryType="scratchpad"
        sidebar={<PageStack />}
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        toolbar={toolbar}
        canvas={<div className="muwi-scratchpad-canvas">{currentPage ? <ScratchpadPage page={currentPage} blocks={currentBlocks} /> : emptyCanvas}</div>}
        status={status}
      />
      <PasskeyPrompt
        isOpen={showUnlockPrompt}
        onClose={() => setShowUnlockPrompt(false)}
        onSubmit={handleUnlockSubmit}
        title="Unlock page"
        description="Enter your passkey to unlock this page."
        hint={passkeyHint}
        error={lockingError}
        submitLabel="Unlock"
      />
    </>
  );
}
