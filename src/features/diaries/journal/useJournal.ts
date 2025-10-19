import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import {
  deletePage as deletePageFromDb,
  loadPages,
  savePage,
  type Diary,
  type Page,
} from '../../../services/db';
import { createId } from '../../../utils/id';

const SAVE_DEBOUNCE_MS = 800;

interface JournalEntry {
  id: string;
  diaryId: string;
  doc: JSONContent;
  createdAt: number;
  updatedAt: number;
  title: string;
  preview: string;
}

interface UseJournalResult {
  entries: JournalEntry[];
  activeEntry: JournalEntry | null;
  isLoading: boolean;
  error: string | null;
  selectEntry: (entryId: string) => void;
  createEntry: () => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  updateEntry: (entryId: string, doc: JSONContent) => void;
}

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function cloneDoc(doc: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(doc)) as JSONContent;
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toDateString();
  }
}

function gatherText(node: JSONContent | undefined): string {
  if (!node) {
    return '';
  }
  if (node.type === 'text') {
    return node.text ?? '';
  }
  if (node.type === 'hardBreak') {
    return '\n';
  }
  const parts = (node.content ?? []).map((child: JSONContent | undefined) => gatherText(child));
  return parts.join('');
}

function deriveTitle(doc: JSONContent): string {
  const candidates = (doc.content ?? []) as JSONContent[];
  const heading = candidates.find((node: JSONContent) => node.type === 'heading');
  if (heading) {
    const text = gatherText(heading).trim();
    return text.length > 0 ? text.slice(0, 120) : '';
  }
  const paragraph = candidates.find((node: JSONContent) => node.type === 'paragraph');
  if (paragraph) {
    const text = gatherText(paragraph).trim();
    return text.length > 0 ? text.slice(0, 120) : '';
  }
  return '';
}

function derivePreview(doc: JSONContent): string {
  const paragraphs = (doc.content ?? []).filter((node): node is JSONContent => (node as JSONContent | undefined)?.type === 'paragraph');
  for (const paragraph of paragraphs) {
    const text = gatherText(paragraph).replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      return text.length > 160 ? `${text.slice(0, 157)}…` : text;
    }
  }
  return '';
}

function createInitialDoc(now: number): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: formatDate(now) }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
    ],
  };
}

function toEntry(page: Page, fallbackTitle: string): JournalEntry {
  const rawDoc = (page.doc ?? EMPTY_DOC) as JSONContent;
  const doc = cloneDoc(rawDoc);
  const title = deriveTitle(doc) || fallbackTitle;
  const preview = derivePreview(doc);
  return {
    id: page.id,
    diaryId: page.diaryId,
    doc,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    title,
    preview,
  };
}

export function useJournal(diary: Diary): UseJournalResult {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entriesRef = useRef<JournalEntry[]>([]);
  const saveTimers = useRef<Map<string, number>>(new Map());
  const isMounted = useRef(true);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    isMounted.current = true;
    const timers = saveTimers.current;
    return () => {
      isMounted.current = false;
      if (typeof window !== 'undefined') {
        for (const handle of timers.values()) {
          window.clearTimeout(handle);
        }
      }
      timers.clear();
    };
  }, []);

  const seedInitialEntry = useCallback(async (diaryId: string): Promise<Page[]> => {
    const now = Date.now();
    const doc = createInitialDoc(now);
    const page: Page = {
      id: createId('page'),
      diaryId,
      kind: 'text',
      doc: cloneDoc(doc),
      createdAt: now,
      updatedAt: now,
    };
    await savePage(page);
    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'journal',
        message: 'Seeded initial journal entry for empty diary',
        diaryId,
        pageId: page.id,
      }),
    );
    return [page];
  }, []);

  const decorate = useCallback((page: Page, index: number): JournalEntry => {
    const fallbackTitle = `Entry ${index + 1}`;
    return toEntry(page, fallbackTitle);
  }, []);

  const hydrate = useCallback(async () => {
    try {
      setIsLoading(true);
      const pages = await loadPages(diary.id);
      const textPages = pages.filter((page) => page.kind === 'text');
      const sorted = textPages.length > 0 ? [...textPages] : [];
      sorted.sort((a, b) => a.createdAt - b.createdAt);

      const seeded = sorted.length === 0;
      const ensured = seeded ? await seedInitialEntry(diary.id) : sorted;
      const entriesWithDerived = ensured.map((page, index) => decorate(page, index));

      if (!isMounted.current) {
        return;
      }

      console.info(
        JSON.stringify({
          level: 'INFO',
          timestamp: new Date().toISOString(),
          module: 'journal',
          message: 'Hydrated journal entries',
          diaryId: diary.id,
          pageCount: entriesWithDerived.length,
          seeded,
        }),
      );

      entriesRef.current = entriesWithDerived;
      setEntries(entriesWithDerived);
      setActiveId((current) => {
        if (current && entriesWithDerived.some((entry) => entry.id === current)) {
          return current;
        }
        return entriesWithDerived[entriesWithDerived.length - 1]?.id ?? null;
      });
      setError(null);
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Unable to load journal entries');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [decorate, diary.id, seedInitialEntry]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const persistEntry = useCallback(
    async (entryId: string, doc: JSONContent) => {
      const currentEntry = entriesRef.current.find((candidate) => candidate.id === entryId);
      if (!currentEntry) {
        return;
      }
      const now = Date.now();
      const updatedPage: Page = {
        id: currentEntry.id,
        diaryId: currentEntry.diaryId,
        kind: 'text',
        doc: cloneDoc(doc),
        createdAt: currentEntry.createdAt,
        updatedAt: now,
      };
      await savePage(updatedPage);
      if (!isMounted.current) {
        return;
      }
      const nextEntries = entriesRef.current.map((candidate) => {
        if (candidate.id !== entryId) {
          return candidate;
        }
        const title = deriveTitle(doc) || candidate.title;
        const preview = derivePreview(doc);
        return {
          ...candidate,
          doc: cloneDoc(doc),
          updatedAt: now,
          title,
          preview,
        };
      });
      entriesRef.current = nextEntries;
      setEntries(nextEntries);
    },
    [],
  );

  const scheduleSave = useCallback(
    (entryId: string, doc: JSONContent) => {
      if (typeof window === 'undefined') {
        void persistEntry(entryId, doc);
        return;
      }
      const timers = saveTimers.current;
      const existing = timers.get(entryId);
      if (existing) {
        window.clearTimeout(existing);
      }
      const handle = window.setTimeout(() => {
        timers.delete(entryId);
        void persistEntry(entryId, doc);
      }, SAVE_DEBOUNCE_MS);
      timers.set(entryId, handle);
    },
    [persistEntry],
  );

  const selectEntry = useCallback((entryId: string) => {
    setActiveId(entryId);
  }, []);

  const createEntry = useCallback(async () => {
    const now = Date.now();
    const doc = createInitialDoc(now);
    const id = createId('page');
    const page: Page = {
      id,
      diaryId: diary.id,
      kind: 'text',
      doc: cloneDoc(doc),
      createdAt: now,
      updatedAt: now,
    };
    await savePage(page);

    if (!isMounted.current) {
      return;
    }

    const entry = toEntry(page, `Entry ${entriesRef.current.length + 1}`);
    const nextEntries = [...entriesRef.current, entry];
    entriesRef.current = nextEntries;
    setEntries(nextEntries);
    setActiveId(id);
  }, [diary.id]);

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (entriesRef.current.length <= 1) {
        return;
      }
      if (typeof window !== 'undefined') {
        const existing = saveTimers.current.get(entryId);
        if (existing) {
          window.clearTimeout(existing);
          saveTimers.current.delete(entryId);
        }
      }
      await deletePageFromDb(entryId);
      if (!isMounted.current) {
        return;
      }
      const remaining = entriesRef.current.filter((entry) => entry.id !== entryId);
      entriesRef.current = remaining;
      setEntries(remaining);
      setActiveId((current) => {
        if (current && current !== entryId) {
          return current;
        }
        return remaining[remaining.length - 1]?.id ?? null;
      });
    },
    [],
  );

  const updateEntry = useCallback(
    (entryId: string, doc: JSONContent) => {
      const nextEntries = entriesRef.current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              doc: cloneDoc(doc),
              title: deriveTitle(doc) || entry.title,
              preview: derivePreview(doc),
            }
          : entry,
      );
      entriesRef.current = nextEntries;
      setEntries(nextEntries);
      scheduleSave(entryId, doc);
    },
    [scheduleSave],
  );

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeId) ?? null,
    [entries, activeId],
  );

  return {
    entries,
    activeEntry,
    isLoading,
    error,
    selectEntry,
    createEntry,
    deleteEntry,
    updateEntry,
  };
}
