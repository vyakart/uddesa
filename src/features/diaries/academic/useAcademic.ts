import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Extension, JSONContent } from '@tiptap/core';
import { loadPages, savePage, type Diary, type Page } from '../../../services/db';
import { createId } from '../../../utils/id';
import type { Citation, CitationStyle } from './citations';

const SAVE_DEBOUNCE_MS = 2000;

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function cloneDoc(doc: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(doc)) as JSONContent;
}

const SUPPORTED_CITATION_TYPES = new Set<Citation['type']>(['book', 'article', 'website', 'other']);

function isCitationStyle(value: unknown): value is CitationStyle {
  return value === 'apa' || value === 'mla' || value === 'chicago';
}

function isStoredCitation(value: unknown): value is Citation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Citation>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.year === 'number' &&
    typeof candidate.type === 'string' &&
    SUPPORTED_CITATION_TYPES.has(candidate.type as Citation['type']) &&
    Array.isArray(candidate.authors) &&
    candidate.authors.every((author) => typeof author === 'string' && author.length > 0)
  );
}

function extractAcademicSettings(settings: Diary['settings']): {
  citations: Citation[];
  citationStyle: CitationStyle;
} {
  const record = settings as Record<string, unknown>;
  const citationCandidates = Array.isArray(record['citations']) ? record['citations'] : [];
  const citations = citationCandidates.filter(isStoredCitation);
  const style = record['citationStyle'];

  return {
    citations,
    citationStyle: isCitationStyle(style) ? style : 'apa',
  };
}

interface AcademicState {
  page: Page | null;
  citations: Citation[];
  citationStyle: CitationStyle;
  isLoading: boolean;
  error: string | null;
}

interface UseAcademicResult {
  page: Page | null;
  doc: JSONContent;
  citations: Citation[];
  citationStyle: CitationStyle;
  isLoading: boolean;
  error: string | null;
  updateDoc: (doc: JSONContent) => void;
  addCitation: (citation: Omit<Citation, 'id'>) => void;
  updateCitation: (id: string, citation: Partial<Citation>) => void;
  removeCitation: (id: string) => void;
  setCitationStyle: (style: CitationStyle) => void;
  exportHtml: () => Promise<string>;
  exportMarkdown: () => Promise<string>;
}

/**
 * Custom hook for managing academic documents
 * 
 * Features:
 * - Document state management
 * - Citation library management
 * - Citation style switching
 * - Export with bibliography
 */
export function useAcademic(diary: Diary): UseAcademicResult {
  const [state, setState] = useState<AcademicState>({
    page: null,
    citations: [],
    citationStyle: 'apa',
    isLoading: true,
    error: null,
  });

  const pageRef = useRef<Page | null>(null);
  const citationsRef = useRef<Citation[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    pageRef.current = state.page;
    citationsRef.current = state.citations;
  }, [state.page, state.citations]);

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
        module: 'academic',
        message: 'Created initial academic page',
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
        page = await createInitialPage(diary.id);
      } else {
        page = textPages[0];
      }

      // Load citations from diary settings if available
      const { citations: savedCitations, citationStyle: savedCitationStyle } =
        extractAcademicSettings(diary.settings);

      if (!isMounted.current) {
        return;
      }

      console.info(
        JSON.stringify({
          level: 'INFO',
          timestamp: new Date().toISOString(),
          module: 'academic',
          message: 'Hydrated academic page',
          diaryId: diary.id,
          pageId: page.id,
          citationsCount: savedCitations.length,
        }),
      );

      pageRef.current = page;
      citationsRef.current = savedCitations;
      setState({
        page,
        citations: savedCitations,
        citationStyle: savedCitationStyle,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          page: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unable to load document',
        }));
      }
    }
  }, [diary.id, diary.settings, createInitialPage]);

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

  const addCitation = useCallback((citation: Omit<Citation, 'id'>) => {
    const newCitation: Citation = {
      ...citation,
      id: createId('citation'),
    };

    const updatedCitations = [...citationsRef.current, newCitation];
    citationsRef.current = updatedCitations;
    setState((prev) => ({
      ...prev,
      citations: updatedCitations,
    }));
  }, []);

  const updateCitation = useCallback((id: string, updates: Partial<Citation>) => {
    const updatedCitations = citationsRef.current.map((citation) =>
      citation.id === id ? { ...citation, ...updates } : citation
    );
    citationsRef.current = updatedCitations;
    setState((prev) => ({
      ...prev,
      citations: updatedCitations,
    }));
  }, []);

  const removeCitation = useCallback((id: string) => {
    const updatedCitations = citationsRef.current.filter((citation) => citation.id !== id);
    citationsRef.current = updatedCitations;
    setState((prev) => ({
      ...prev,
      citations: updatedCitations,
    }));
  }, []);

  const setCitationStyle = useCallback((style: CitationStyle) => {
    setState((prev) => ({
      ...prev,
      citationStyle: style,
    }));
  }, []);

  const exportHtml = useCallback(async (): Promise<string> => {
    const { generateHTML } = await import('@tiptap/html');
    const { createSchema } = await import('../../../editors/tiptap/schema');
    const { MathInline, MathBlock } = await import('../../../editors/tiptap/extensions/MathNode');

    const baseExtensions = createSchema({});
    const extensions: Extension[] = [
      MathInline as Extension,
      MathBlock as Extension,
      ...baseExtensions,
    ];
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
    citations: state.citations,
    citationStyle: state.citationStyle,
    isLoading: state.isLoading,
    error: state.error,
    updateDoc,
    addCitation,
    updateCitation,
    removeCitation,
    setCitationStyle,
    exportHtml,
    exportMarkdown,
  };
}
