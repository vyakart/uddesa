import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deletePage as deletePageFromDb,
  loadPages,
  savePage,
  type CanvasScene,
  type Diary,
  type Page,
} from '../../../services/db';
import { emptyScene, packScene, unpackScene } from '../../../editors/excalidraw/scene';
import type { Scene } from '../../../editors/excalidraw/excalApi';
import { sceneToThumbnail } from '../../../editors/excalidraw/thumbs';
import { createId } from '../../../utils/id';

const SCRATCHPAD_COLORS = ['#fde68a', '#bae6fd', '#fbcfe8', '#bbf7d0', '#fcd34d', '#e0f2fe'];
const SAVE_DEBOUNCE_MS = 700;

interface ScratchpadPage {
  id: string;
  diaryId: string;
  scene: Scene;
  thumbDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}

function sceneBackground(scene: Scene): string {
  const background = (scene.appState?.viewBackgroundColor as string | undefined) ?? '#f8fafc';
  return background;
}

function createScene(background: string): Scene {
  const base = emptyScene();
  return {
    ...base,
    appState: {
      ...base.appState,
      viewBackgroundColor: background,
      currentItemStrokeColor: '#1f2937',
      currentItemBackgroundColor: background,
    },
  };
}

export interface UseScratchpadResult {
  pages: ScratchpadPage[];
  activePage: ScratchpadPage | null;
  isLoading: boolean;
  error: string | null;
  selectPage: (pageId: string) => void;
  createPage: () => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  updateScene: (pageId: string, scene: Scene) => void;
}

export function useScratchpad(diary: Diary): UseScratchpadResult {
  const [pages, setPages] = useState<ScratchpadPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveTimers = useRef<Map<string, number>>(new Map());
  const pagesRef = useRef<ScratchpadPage[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const decoratePage = useCallback(async (page: Page): Promise<ScratchpadPage> => {
    const scene = unpackScene(page.scene);
    let thumb = page.thumbDataUrl;
    if (!thumb) {
      thumb = await sceneToThumbnail(scene, { placeholderColor: sceneBackground(scene) });
      await savePage({
        ...page,
        scene: packScene(scene) as CanvasScene,
        thumbDataUrl: thumb,
      });
    }

    return {
      id: page.id,
      diaryId: page.diaryId,
      scene,
      thumbDataUrl: thumb,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }, []);

  const seedDefaults = useCallback(async (diaryId: string): Promise<Page[]> => {
    const now = Date.now();
    const defaults = SCRATCHPAD_COLORS.slice(0, 3);

    for (let index = 0; index < defaults.length; index += 1) {
      const color = defaults[index];
      const scene = createScene(color);
      const thumb = await sceneToThumbnail(scene, { placeholderColor: color });
      const createdAt = now + index;
      const page: Page = {
        id: createId('page'),
        diaryId,
        kind: 'canvas',
        scene: packScene(scene) as CanvasScene,
        thumbDataUrl: thumb,
        createdAt,
        updatedAt: createdAt,
      };
      await savePage(page);
    }

    return loadPages(diaryId);
  }, []);

  const hydrate = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await loadPages(diary.id);
      const scratchpadPages = stored.filter((page) => page.kind === 'canvas');
      const ensured = scratchpadPages.length > 0 ? scratchpadPages : await seedDefaults(diary.id);

      const decorated = await Promise.all(
        ensured.map(async (page) => decoratePage(page)),
      );
      decorated.sort((a, b) => a.createdAt - b.createdAt);
      if (!isMounted.current) return;
      pagesRef.current = decorated;
      setPages(decorated);
      setActivePageId((prev) => {
        if (prev && decorated.some((page) => page.id === prev)) {
          return prev;
        }
        return decorated[0]?.id ?? null;
      });
      setError(null);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : 'Unable to load scratchpad pages');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [decoratePage, diary.id, seedDefaults]);

  useEffect(() => {
    isMounted.current = true;
    void hydrate();
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
  }, [hydrate]);

  const selectPage = useCallback((pageId: string) => {
    setActivePageId(pageId);
  }, []);

  const scheduleSave = useCallback(
    (pageId: string, scene: Scene) => {
      if (typeof window === 'undefined') {
        return;
      }
      const timers = saveTimers.current;
      const existing = timers.get(pageId);
      if (existing) {
        window.clearTimeout(existing);
      }
      const handle = window.setTimeout(async () => {
        timers.delete(pageId);
        const page = pagesRef.current.find((item) => item.id === pageId);
        if (!page) {
          return;
        }
        const thumb = await sceneToThumbnail(scene, { placeholderColor: sceneBackground(scene) });
        const updatedAt = Date.now();
        await savePage({
          id: page.id,
          diaryId: page.diaryId,
          kind: 'canvas',
          scene: packScene(scene) as CanvasScene,
          thumbDataUrl: thumb,
          createdAt: page.createdAt,
          updatedAt,
        });
        if (!isMounted.current) {
          return;
        }
        const nextPages = pagesRef.current.map((item) =>
          item.id === pageId
            ? {
                ...item,
                scene,
                thumbDataUrl: thumb,
                updatedAt,
              }
            : item,
        );
        pagesRef.current = nextPages;
        setPages(nextPages);
      }, SAVE_DEBOUNCE_MS);
      timers.set(pageId, handle);
    },
    [],
  );

  const updateScene = useCallback(
    (pageId: string, scene: Scene) => {
      const nextPages = pagesRef.current.map((page) =>
        page.id === pageId ? { ...page, scene } : page,
      );
      pagesRef.current = nextPages;
      setPages(nextPages);
      scheduleSave(pageId, scene);
    },
    [scheduleSave],
  );

  const createPage = useCallback(async () => {
    const index = pagesRef.current.length;
    const color = SCRATCHPAD_COLORS[index % SCRATCHPAD_COLORS.length];
    const scene = createScene(color);
    const thumb = await sceneToThumbnail(scene, { placeholderColor: color });
    const createdAt = Date.now();
    const id = createId('page');

    const dbPage: Page = {
      id,
      diaryId: diary.id,
      kind: 'canvas',
      scene: packScene(scene) as CanvasScene,
      thumbDataUrl: thumb,
      createdAt,
      updatedAt: createdAt,
    };

    await savePage(dbPage);

    const scratchpadPage: ScratchpadPage = {
      id,
      diaryId: diary.id,
      scene,
      thumbDataUrl: thumb,
      createdAt,
      updatedAt: createdAt,
    };

    if (!isMounted.current) {
      return;
    }

    const nextPages = [...pagesRef.current, scratchpadPage];
    pagesRef.current = nextPages;
    setPages(nextPages);
    setActivePageId(id);
  }, [diary.id]);

  const deletePage = useCallback(
    async (pageId: string) => {
      if (pagesRef.current.length <= 1) {
        return;
      }
      if (typeof window !== 'undefined') {
        const timer = saveTimers.current.get(pageId);
        if (timer) {
          window.clearTimeout(timer);
          saveTimers.current.delete(pageId);
        }
      }
      const remaining = pagesRef.current.filter((page) => page.id !== pageId);
      pagesRef.current = remaining;
      await deletePageFromDb(pageId);
      if (!isMounted.current) {
        return;
      }
      setPages(remaining);
      setActivePageId((currentId) => {
        if (currentId && currentId !== pageId) {
          return currentId;
        }
        return remaining[0]?.id ?? null;
      });
    },
    [],
  );

  const activePage = useMemo(() => pages.find((page) => page.id === activePageId) ?? null, [activePageId, pages]);

  return {
    pages,
    activePage,
    isLoading,
    error,
    selectPage,
    createPage,
    deletePage,
    updateScene,
  };
}
