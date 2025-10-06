import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Diary, DiaryKind } from '../../services/db';
import { loadDiary } from '../../services/db';
import { DIARY_PRESETS } from './diaryPresets';
import type { DiaryScreenProps } from './types';

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

  const preset = useMemo(
    () => (diary ? DIARY_PRESETS.find((candidate) => candidate.kind === diary.kind) ?? null : null),
    [diary],
  );

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
        <Link to="/settings" className="diary__settings">
          Settings
        </Link>
      </header>
      {preset?.description ? <p className="diary__description">{preset.description}</p> : null}
      <main className="diary__content">
        <Suspense fallback={<div className="diary__status">Loading editor…</div>}>
          <View diary={diary} />
        </Suspense>
      </main>
    </div>
  );
}
