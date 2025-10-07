import { useCallback } from 'react';
import { serializeToHtml, serializeToMarkdown } from '../../../editors/tiptap/serialize';
import { RichText } from '../../../editors/tiptap/RichText';
import type { DiaryScreenProps } from '../types';
import { useJournal } from './useJournal';

function formatRelative(timestamp: number): string {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;

  if (diff < oneMinute) {
    return 'just now';
  }
  if (diff < oneHour) {
    const minutes = Math.round(diff / oneMinute);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diff < oneDay) {
    const hours = Math.round(diff / oneHour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'journal-entry';
}

export function JournalView({ diary }: DiaryScreenProps) {
  const { entries, activeEntry, isLoading, error, selectEntry, createEntry, deleteEntry, updateEntry } =
    useJournal(diary);

  const handleExport = useCallback(
    (kind: 'html' | 'markdown') => {
      if (!activeEntry || typeof window === 'undefined') {
        return;
      }
      const filenameBase = slugify(activeEntry.title);
      const timestamp = new Date(activeEntry.updatedAt);
      const timestampSuffix = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(
        timestamp.getDate(),
      ).padStart(2, '0')}`;
      const filename =
        kind === 'html'
          ? `${filenameBase}-${timestampSuffix}.html`
          : `${filenameBase}-${timestampSuffix}.md`;
      const content =
        kind === 'html' ? serializeToHtml(activeEntry.doc) : serializeToMarkdown(activeEntry.doc);
      const blob = new Blob([content], {
        type: kind === 'html' ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    },
    [activeEntry],
  );

  return (
    <div className="journal">
      <aside className="journal__sidebar">
        <header className="journal__sidebar-header">
          <h2>Entries</h2>
          <button
            type="button"
            className="journal__new-entry"
            onClick={() => {
              void createEntry();
            }}
          >
            New entry
          </button>
        </header>
        {entries.length === 0 ? (
          <p className="journal__empty">No entries yet.</p>
        ) : (
          <ul className="journal__entry-list">
            {entries.map((entry) => {
              const isActive = activeEntry?.id === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={isActive ? 'journal__entry journal__entry--active' : 'journal__entry'}
                    onClick={() => selectEntry(entry.id)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="journal__entry-title">{entry.title}</span>
                    {entry.preview ? <span className="journal__entry-preview">{entry.preview}</span> : null}
                    <span className="journal__entry-meta">{formatRelative(entry.updatedAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <section className="journal__workspace">
        {isLoading && !activeEntry ? (
          <div className="journal__status">Loading journal…</div>
        ) : error ? (
          <div className="journal__status journal__status--error">{error}</div>
        ) : activeEntry ? (
          <div className="journal__editor">
            <header className="journal__editor-header">
              <div>
                <h2>{activeEntry.title}</h2>
                <span className="journal__editor-meta">Updated {formatRelative(activeEntry.updatedAt)}</span>
              </div>
              <div className="journal__editor-actions">
                <button
                  type="button"
                  onClick={() => handleExport('html')}
                  className="journal__editor-action"
                >
                  Export HTML
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('markdown')}
                  className="journal__editor-action"
                >
                  Export Markdown
                </button>
                <button
                  type="button"
                  className="journal__editor-action journal__editor-action--danger"
                  onClick={() => {
                    void deleteEntry(activeEntry.id);
                  }}
                  disabled={entries.length <= 1}
                >
                  Delete
                </button>
              </div>
            </header>
            <RichText
              value={activeEntry.doc}
              onChange={(doc) => updateEntry(activeEntry.id, doc)}
              placeholder="Dear diary…"
              className="journal__editor-content"
            />
          </div>
        ) : (
          <div className="journal__status">Select or create an entry to begin.</div>
        )}
      </section>
    </div>
  );
}
