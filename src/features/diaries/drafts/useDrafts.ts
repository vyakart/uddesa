import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { loadPages, savePage, type Diary, type Page } from '../../../services/db';
import { createId } from '../../../utils/id';

const SAVE_DEBOUNCE_MS = 2000;

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [
    { type: 'title', content: [] },
    { type: 'paragraph', content: [] },
  ],
};

function cloneDoc(doc: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(doc)) as JSONContent;
}

interface DraftState {
  page: Page | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDraftsResult {
  page: Page | null;
  doc: JSONContent;
  isLoading: boolean;
  error: string | null;
  updateDoc: (doc: JSONContent) => void;
  exportHtml: () => Promise<string>;
  exportMarkdown: () => Promise<string>;
}

/**
 * Custom hook for managing a single draft document
 * 
 * Features:
 * - Loads single page from database
 * - Debounced autosave (2 seconds)
 * - Export to HTML and Markdown
 * - Automatic initial document creation
 */
export function useDrafts(diary: Diary): UseDraftsResult {
  const [state, setState] = useState<DraftState>({
    page: null,
    isLoading: true,
    error: null,
  });

  const pageRef = useRef<Page | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    pageRef.current = state.page;
  }, [state.page]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (saveTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const createInitialPage = useCallback(async (diaryId: string): Promise<Page> => {
    const now = Date.now();
    const page: Page = {
      id: createId('page'),
      diaryId,
      kind: 'text',
      doc: cloneDoc(EMPTY_DOC),
      createdAt: now,
      updatedAt: now,
    };
    await savePage(page);
    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'drafts',
        message: 'Created initial draft page',
        diaryId,
        pageId: page.id,
      }),
    );
    return page;
  }, []);

  const hydrate = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      const pages = await loadPages(diary.id);
      const textPages = pages.filter((p) => p.kind === 'text');
      
      let page: Page;
      if (textPages.length === 0) {
        // Create initial page if none exists
        page = await createInitialPage(diary.id);
      } else {
        // Use the first (and should be only) text page
        page = textPages[0];
      }

      if (!isMounted.current) {
        return;
      }

      console.info(
        JSON.stringify({
          level: 'INFO',
          timestamp: new Date().toISOString(),
          module: 'drafts',
          message: 'Hydrated draft page',
          diaryId: diary.id,
          pageId: page.id,
        }),
      );

      pageRef.current = page;
      setState({
        page,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (isMounted.current) {
        setState({
          page: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unable to load draft',
        });
      }
    }
  }, [diary.id, createInitialPage]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const persistPage = useCallback(async (doc: JSONContent) => {
    const currentPage = pageRef.current;
    if (!currentPage) {
      return;
    }

    const now = Date.now();
    const updatedPage: Page = {
      ...currentPage,
      doc: cloneDoc(doc),
      updatedAt: now,
    };

    await savePage(updatedPage);

    if (!isMounted.current) {
      return;
    }

    pageRef.current = updatedPage;
    setState((prev) => ({
      ...prev,
      page: updatedPage,
    }));
  }, []);

  const scheduleSave = useCallback(
    (doc: JSONContent) => {
      if (typeof window === 'undefined') {
        void persistPage(doc);
        return;
      }

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void persistPage(doc);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistPage],
  );

  const updateDoc = useCallback(
    (doc: JSONContent) => {
      const cloned = cloneDoc(doc);
      
      if (pageRef.current) {
        const updatedPage = {
          ...pageRef.current,
          doc: cloned,
        };
        pageRef.current = updatedPage;
        setState((prev) => ({
          ...prev,
          page: updatedPage,
        }));
      }

      scheduleSave(cloned);
    },
    [scheduleSave],
  );

  const exportHtml = useCallback(async (): Promise<string> => {
    const { generateHTML } = await import('@tiptap/html');
    const { createSchema } = await import('../../../editors/tiptap/schema');
    const { TitleNode } = await import('../../../editors/tiptap/extensions/TitleNode');
    
    const extensions = [TitleNode, ...createSchema({})];
    const doc = state.page?.doc ?? EMPTY_DOC;
    
    return generateHTML(doc, extensions);
  }, [state.page?.doc]);

  const exportMarkdown = useCallback(async (): Promise<string> => {
    const { serializeToMarkdown } = await import('../../../editors/tiptap/serialize');
    const doc = state.page?.doc ?? EMPTY_DOC;
    
    return serializeToMarkdown(doc);
  }, [state.page?.doc]);

  const doc = useMemo(
    () => (state.page?.doc as JSONContent | undefined) ?? EMPTY_DOC,
    [state.page?.doc],
  );

  return {
    page: state.page,
    doc,
    isLoading: state.isLoading,
    error: state.error,
    updateDoc,
    exportHtml,
    exportMarkdown,
  };
}