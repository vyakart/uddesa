import { useEffect, useState, useCallback } from 'react';
import { DiaryLayout } from '@/components/common';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { ScratchpadPage } from './ScratchpadPage';
import { PageStack } from './PageStack';
import { CategoryPicker } from './CategoryPicker';
import type { CategoryName } from '@/types/scratchpad';

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
  const findFreshPage = useScratchpadStore((state) => state.findFreshPage);

  const currentPage = pages[currentPageIndex];
  const currentBlocks = currentPage ? (textBlocks.get(currentPage.id) || []) : [];

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

  // Toolbar content
  const toolbar = (
    <div className="flex items-center gap-3">
      {currentPage && (
        <CategoryPicker
          currentCategory={currentPage.categoryName}
          categoryColor={currentPage.categoryColor}
          onCategoryChange={handleCategoryChange}
          disabled={currentPage.isLocked}
        />
      )}
      <button
        onClick={handleCreatePage}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
        title="New page (Ctrl+N)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New
      </button>
    </div>
  );

  // Show loading state during initialization
  if (!isInitialized || isLoading) {
    return (
      <DiaryLayout diaryType="scratchpad" toolbar={toolbar}>
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading...
        </div>
      </DiaryLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DiaryLayout diaryType="scratchpad" toolbar={toolbar}>
        <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-red-500 rounded-md hover:bg-red-50"
          >
            Reload
          </button>
        </div>
      </DiaryLayout>
    );
  }

  return (
    <DiaryLayout diaryType="scratchpad" toolbar={toolbar}>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* Main content area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {currentPage ? (
            <ScratchpadPage page={currentPage} blocks={currentBlocks} />
          ) : (
            <div style={{ padding: '2rem', color: '#888' }}>No page found</div>
          )}
        </div>

        {/* Page stack on the right */}
        <div
          style={{
            width: '48px',
            borderLeft: '1px solid #e0e0e0',
            backgroundColor: 'white',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <PageStack />
        </div>

        {/* Page counter at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '0.875rem',
            color: '#666',
            zIndex: 10,
          }}
        >
          Page {currentPageIndex + 1} of {pages.length}
        </div>
      </div>
    </DiaryLayout>
  );
}
