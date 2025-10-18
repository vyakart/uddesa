import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  countPages,
  deleteDiary,
  listDiaries,
  saveDiary,
  type Diary,
  type DiaryKind,
} from '../../services/db';
import { DIARY_PRESETS, type DiaryPreset } from './diaryPresets';
import { createId } from '../../utils/id';

interface ShelfEntry {
  diary: Diary;
  pageCount: number;
}

export function ShelfHome() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ShelfEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const presetByKind = useMemo(
    () => new Map<DiaryKind, DiaryPreset>(DIARY_PRESETS.map((preset) => [preset.kind, preset])),
    [],
  );

  useEffect(() => {
    void refreshShelf();
  }, []);

  async function refreshShelf() {
    try {
      setIsLoading(true);
      const diaries = await listDiaries();
      const withCounts: ShelfEntry[] = await Promise.all(
        diaries.map(async (diary) => ({
          diary,
          pageCount: await countPages(diary.id),
        })),
      );
      setEntries(withCounts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shelf');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(kind: DiaryKind) {
    const preset = presetByKind.get(kind);
    if (!preset) return;

    const now = Date.now();
    const diary: Diary = {
      id: createId('diary'),
      kind: preset.kind,
      title: preset.title,
      settings: preset.defaults,
      createdAt: now,
      updatedAt: now,
    };

    await saveDiary(diary);
    await refreshShelf();
    navigate(`/diary/${diary.id}`);
  }

  async function handleDelete(diary: Diary) {
    await deleteDiary(diary.id);
    await refreshShelf();
  }

  return (
    <div className="shelf">
      <header className="shelf__header">
        <div>
          <h1>Notebook Shelf</h1>
          <p className="shelf__tagline">Pick a diary or start a fresh one.</p>
        </div>
      </header>
      <div className="shelf__actions">
        <details className="shelf__creator">
          <summary aria-label="Create a new diary from a preset">New diary</summary>
          <div className="shelf__preset-grid">
            {DIARY_PRESETS.map((preset) => {
              const descriptionId = `preset-${preset.kind}-description`;
              return (
                <button
                  key={preset.kind}
                  type="button"
                  className="shelf__preset"
                  onClick={() => void handleCreate(preset.kind)}
                  aria-describedby={descriptionId}
                >
                  <span className="shelf__preset-title">{preset.title}</span>
                  <span id={descriptionId} className="shelf__preset-description">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      </div>
      {isLoading ? (
        <p className="shelf__status" role="status" aria-live="polite">
          Loading diaries…
        </p>
      ) : error ? (
        <p className="shelf__error" role="alert">
          {error}
        </p>
      ) : entries.length === 0 ? (
        <p className="shelf__status" role="status" aria-live="polite">
          No diaries yet. Create one to begin.
        </p>
      ) : (
        <div className="shelf__grid">
          {entries.map(({ diary, pageCount }) => {
            const presetTitle = presetByKind.get(diary.kind)?.title ?? diary.kind;
            const metaId = `diary-${diary.id}-meta`;
            return (
              <article key={diary.id} className={`shelf__card shelf__card--${diary.kind}`}>
                <button
                  type="button"
                  className="shelf__card-body"
                  onClick={() => navigate(`/diary/${diary.id}`)}
                  aria-describedby={metaId}
                  aria-label={`Open ${diary.title}`}
                >
                  <span className="shelf__card-kind">{presetTitle}</span>
                  <h2>{diary.title}</h2>
                  <span id={metaId} className="shelf__card-meta">
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                  </span>
                </button>
                <button
                  type="button"
                  className="shelf__delete"
                  onClick={() => void handleDelete(diary)}
                  aria-label={`Delete ${diary.title}`}
                >
                  ×
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
