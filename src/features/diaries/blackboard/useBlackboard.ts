import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadPages,
  savePage,
  type CanvasScene,
  type Diary,
  type Page,
} from '../../../services/db';
import { emptyScene, packScene, unpackScene } from '../../../editors/excalidraw/scene';
import type { Scene } from '../../../editors/excalidraw/excalApi';
import { createId } from '../../../utils/id';

const SAVE_DEBOUNCE_MS = 800;

interface BlackboardState {
  scene: Scene | null;
  pageId: string | null;
  isLoading: boolean;
  error: string | null;
  updateScene: (scene: Scene) => void;
}

function createDefaultScene(background: string | undefined): Scene {
  const base = emptyScene();
  const boardBackground = background ?? '#111827';
  return {
    ...base,
    appState: {
      ...base.appState,
      viewBackgroundColor: boardBackground,
      currentItemBackgroundColor: boardBackground,
      currentItemStrokeColor: '#f8fafc',
    },
  };
}

export function useBlackboard(diary: Diary): BlackboardState {
  const diaryId = diary.id;
  const defaultBackground = diary.settings.background;
  const [scene, setScene] = useState<Scene | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef<Page | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        setIsLoading(true);
        const pages = await loadPages(diaryId);
        const existing = pages.find((page) => page.kind === 'canvas');
        if (!existing) {
          const now = Date.now();
          const initialScene = createDefaultScene(defaultBackground);
          const newPage: Page = {
            id: createId('page'),
            diaryId,
            kind: 'canvas',
            scene: packScene(initialScene) as CanvasScene,
            createdAt: now,
            updatedAt: now,
          };
          await savePage(newPage);
          if (cancelled) return;
          pageRef.current = newPage;
          setScene(initialScene);
          setPageId(newPage.id);
        } else {
          const unpacked = unpackScene(existing.scene);
          if (cancelled) return;
          pageRef.current = existing;
          setScene(unpacked);
          setPageId(existing.id);
        }
        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unable to load blackboard';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = null;
    };
  }, [diaryId, defaultBackground]);

  const persistScene = useCallback(
    async (nextScene: Scene) => {
      const now = Date.now();
      const existing = pageRef.current;
      const packed = packScene(nextScene) as CanvasScene;

      const record: Page = existing
        ? {
            ...existing,
            scene: packed,
            updatedAt: now,
          }
        : {
            id: createId('page'),
            diaryId,
            kind: 'canvas',
            scene: packed,
            createdAt: now,
            updatedAt: now,
          };

      await savePage(record);
      pageRef.current = record;
      setPageId(record.id);
    },
    [diaryId],
  );

  const scheduleSave = useCallback(
    (nextScene: Scene) => {
      if (typeof window === 'undefined') {
        void persistScene(nextScene);
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void persistScene(nextScene);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistScene],
  );

  const updateScene = useCallback(
    (nextScene: Scene) => {
      setScene(nextScene);
      scheduleSave(nextScene);
    },
    [scheduleSave],
  );

  return {
    scene,
    pageId,
    isLoading,
    error,
    updateScene,
  };
}
