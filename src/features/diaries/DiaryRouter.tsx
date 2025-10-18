import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Diary, DiaryKind, Lock } from '../../services/db';
import { loadDiary, loadLock } from '../../services/db';
import { DIARY_PRESETS } from './diaryPresets';
import type { DiaryScreenProps } from './types';
import { LockDialog } from '../../ui/LockDialog';
import { lockDiary, unlockDiary } from '../../services/locks';
import { sessionManager } from '../../services/session';
import { shortcuts, DEFAULT_SHORTCUTS } from '../../services/shortcuts';

function lazyDiaryView(
  importer: () => Promise<{ default: ComponentType<DiaryScreenProps> }>,
): LazyExoticComponent<ComponentType<DiaryScreenProps>> {
  return lazy(importer);
}

const VIEW_BY_KIND: Record<DiaryKind, LazyExoticComponent<ComponentType<DiaryScreenProps>>> = {
  scratchpad: lazyDiaryView(() =>
    import('./scratchpad/ScratchpadView').then((module) => ({ default: module.ScratchpadView })),
  ),
  blackboard: lazyDiaryView(() =>
    import('./blackboard/BlackboardView').then((module) => ({ default: module.BlackboardView })),
  ),
  journal: lazyDiaryView(() =>
    import('./journal/JournalView').then((module) => ({ default: module.JournalView })),
  ),
  drafts: lazyDiaryView(() =>
    import('./drafts/DraftsView').then((module) => ({ default: module.DraftsView })),
  ),
  longform: lazyDiaryView(() =>
    import('./longform/LongformView').then((module) => ({ default: module.LongformView })),
  ),
  academic: lazyDiaryView(() =>
    import('./academic/AcademicView').then((module) => ({ default: module.AcademicView })),
  ),
};

export function DiaryRouter() {
  const { id } = useParams<{ id: string }>();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [status, setStatus] = useState<'loading' | 'missing' | 'ready'>('loading');
  const [lockInfo, setLockInfo] = useState<Lock | null>(null);
  const [isLockLoading, setIsLockLoading] = useState(true);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [lockMode, setLockMode] = useState<'lock' | 'unlock'>('lock');

  useEffect(() => {
    if (!id) {
      setStatus('missing');
      return;
    }

    let cancelled = false;

    async function load(currentId: string) {
      setStatus('loading');
      const result = await loadDiary(currentId);
      if (cancelled) return;
      if (!result) {
        setDiary(null);
        setStatus('missing');
        return;
      }
      setDiary(result);
      setStatus('ready');
    }

    void load(id);

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLock(currentDiary: Diary) {
      setIsLockLoading(true);
      try {
        const lock = await loadLock(currentDiary.id);
        if (cancelled) {
          return;
        }
        setLockInfo(lock ?? null);

        if (lock?.locked) {
          const rememberedPassword = sessionManager.getSessionPassword(currentDiary.id);
          if (rememberedPassword) {
            try {
              await unlockDiary(currentDiary.id, rememberedPassword);
              const refreshed = await loadLock(currentDiary.id);
              if (!cancelled) {
                setLockInfo(refreshed ?? null);
              }
            } catch (error) {
              console.warn(
                JSON.stringify({
                  level: 'WARN',
                  timestamp: new Date().toISOString(),
                  module: 'diary-router',
                  message: 'Auto unlock failed',
                  diaryId: currentDiary.id,
                  error: error instanceof Error ? error.message : String(error),
                }),
              );
              sessionManager.endSession(currentDiary.id);
              if (!cancelled) {
                setLockInfo(lock);
              }
            }
          }
        }
      } finally {
        if (!cancelled) {
          setIsLockLoading(false);
        }
      }
    }

    if (diary) {
      void hydrateLock(diary);
    } else {
      setLockInfo(null);
      setIsLockLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [diary]);

  const preset = useMemo(
    () => (diary ? DIARY_PRESETS.find((candidate) => candidate.kind === diary.kind) ?? null : null),
    [diary],
  );

  const isLocked = lockInfo?.locked === true;

  const openLockDialog = useCallback(() => {
    setLockMode('lock');
    setIsLockDialogOpen(true);
  }, []);

  const openUnlockDialog = useCallback(() => {
    setLockMode('unlock');
    setIsLockDialogOpen(true);
  }, []);

  const closeLockDialog = useCallback(() => {
    setIsLockDialogOpen(false);
  }, []);

  const handleLock = useCallback(
    async (password: string) => {
      if (!diary) {
        return;
      }

      await lockDiary(diary.id, password);
      sessionManager.endSession(diary.id);
      const updatedLock = await loadLock(diary.id);
      setLockInfo(updatedLock ?? null);
    },
    [diary],
  );

  const handleUnlock = useCallback(
    async (password: string, remember: boolean) => {
      if (!diary) {
        return;
      }

      await unlockDiary(diary.id, password);
      sessionManager.startSession(diary.id, password, remember);
      if (!remember) {
        sessionManager.endSession(diary.id);
      }
      const updatedLock = await loadLock(diary.id);
      setLockInfo(updatedLock ?? null);
    },
    [diary],
  );

  useEffect(() => {
    if (!diary) {
      return;
    }

    const shortcut = DEFAULT_SHORTCUTS.lock;
    const unregister = shortcuts.register({
      key: shortcut.key,
      description: shortcut.description,
      context: shortcut.context,
      handler: () => {
        if (lockInfo?.locked) {
          openUnlockDialog();
        } else {
          openLockDialog();
        }
        return true;
      },
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'ctrl') ? { ctrl: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'meta') ? { meta: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'alt') ? { alt: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'shift') ? { shift: true } : {}),
    });

    return unregister;
  }, [diary, lockInfo?.locked, openLockDialog, openUnlockDialog]);

  if (status === 'loading') {
    return <p className="diary__status">Loading diary…</p>;
  }

  if (!diary) {
    return (
      <div className="diary__status">
        <p>Diary not found.</p>
        <Link to="/">Return to the shelf</Link>
      </div>
    );
  }

  const View = VIEW_BY_KIND[diary.kind];

  if (!View) {
    return (
      <div className="diary__status">
        <p>Unsupported diary type.</p>
        <Link to="/">Return to the shelf</Link>
      </div>
    );
  }

  return (
    <div className={`diary diary--${diary.kind}`}>
      <header className="diary__header">
        <Link to="/" className="diary__back" aria-label="Return to shelf">
          ← Shelf
        </Link>
        <div className="diary__titles">
          <p className="diary__kind">{preset?.title ?? diary.kind}</p>
          <h1>{diary.title}</h1>
        </div>
        <div className="diary__actions">
          <button
            type="button"
            className="diary__lock"
            onClick={isLocked ? openUnlockDialog : openLockDialog}
            disabled={isLockLoading}
            aria-label={isLocked ? 'Unlock diary' : 'Lock diary'}
            aria-pressed={isLocked}
            aria-haspopup="dialog"
            aria-controls="lock-dialog"
          >
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <Link to="/settings" className="diary__settings">
            Settings
          </Link>
        </div>
      </header>
      {preset?.description ? <p className="diary__description">{preset.description}</p> : null}
      <main className="diary__content" aria-busy={isLockLoading}>
        {isLockLoading ? (
          <div className="diary__status" role="status" aria-live="polite">
            Checking lock…
          </div>
        ) : isLocked ? (
          <div className="diary__locked" role="status" aria-live="polite">
            <p>This diary is locked. Unlock to continue.</p>
            <button
              type="button"
              className="diary__unlock"
              onClick={openUnlockDialog}
              aria-label="Unlock diary"
              aria-haspopup="dialog"
              aria-controls="lock-dialog"
            >
              Unlock diary
            </button>
          </div>
        ) : (
          <Suspense fallback={<div className="diary__status">Loading editor…</div>}>
            <View diary={diary} />
          </Suspense>
        )}
      </main>
      <LockDialog
        isOpen={isLockDialogOpen}
        onClose={closeLockDialog}
        onLock={lockMode === 'lock' ? handleLock : undefined}
        onUnlock={lockMode === 'unlock' ? handleUnlock : undefined}
        isLocked={lockMode === 'unlock'}
        diaryTitle={diary.title}
      />
    </div>
  );
}
