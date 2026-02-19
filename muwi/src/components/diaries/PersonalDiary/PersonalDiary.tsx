import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { Button, DiaryLayout } from '@/components/common';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { defaultPersonalDiarySettings } from '@/types/diary';
import { EntryNavigation } from './EntryNavigation';
import { DiaryEntry } from './DiaryEntry';

// Helper to safely convert entry.date to Date object (handles both string and Date)
function toDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return parseISO(date);
}

function countWordsFromContent(content: string): number {
  const plainText = content.replace(/<[^>]*>/g, ' ');
  return plainText.trim().split(/\s+/).filter(Boolean).length;
}

function formatReadTime(words: number): string {
  if (words <= 0) {
    return '0 min read';
  }
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function PersonalDiary() {
  const [isInitialized, setIsInitialized] = useState(false);

  const entries = usePersonalDiaryStore((state) => state.entries);
  const currentEntry = usePersonalDiaryStore((state) => state.currentEntry);
  const error = usePersonalDiaryStore((state) => state.error);
  const loadEntries = usePersonalDiaryStore((state) => state.loadEntries);
  const loadEntry = usePersonalDiaryStore((state) => state.loadEntry);
  const updateEntry = usePersonalDiaryStore((state) => state.updateEntry);
  const updateEntryLock = usePersonalDiaryStore((state) => state.updateEntryLock);
  const diarySettings = useSettingsStore((state) => state.personalDiary);

  // Initialize: load entries first, then load today's entry
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadEntries();
        await loadEntry(new Date());
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Personal Diary:', err);
        setIsInitialized(true); // Still mark as initialized to show error state
      }
    };
    initialize();
  }, [loadEntries, loadEntry]);

  const handleDateChange = useCallback(
    (date: Date) => {
      loadEntry(date);
    },
    [loadEntry]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentEntry) {
        updateEntry(currentEntry.id, content);
      }
    },
    [currentEntry, updateEntry]
  );

  const handleCreateNewEntry = useCallback(() => {
    const existingDates = new Set(entries.map((entry) => format(toDate(entry.date), 'yyyy-MM-dd')));
    let candidate = addDays(currentEntry ? toDate(currentEntry.date) : new Date(), 1);

    while (existingDates.has(format(candidate, 'yyyy-MM-dd'))) {
      candidate = addDays(candidate, 1);
    }

    loadEntry(candidate);
  }, [entries, currentEntry, loadEntry]);

  const handleGoToToday = useCallback(() => {
    loadEntry(new Date());
  }, [loadEntry]);

  const handleLockChange = useCallback(
    (isLocked: boolean) => {
      if (!currentEntry) {
        return;
      }
      updateEntryLock(currentEntry.id, isLocked);
    },
    [currentEntry, updateEntryLock]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      const baseDate = currentEntry ? toDate(currentEntry.date) : new Date();

      if (isMod && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleCreateNewEntry();
        return;
      }

      if (event.key === 'PageUp') {
        event.preventDefault();
        loadEntry(subDays(baseDate, 1));
        return;
      }

      if (event.key === 'PageDown') {
        event.preventDefault();
        loadEntry(addDays(baseDate, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEntry, loadEntry, handleCreateNewEntry]);

  const isBusy = !isInitialized;
  const currentDate = currentEntry ? toDate(currentEntry.date) : new Date();
  const defaultPaperColor = defaultPersonalDiarySettings.paperColor.toLowerCase();
  const currentPaperColor = diarySettings.paperColor.trim().toLowerCase();
  const canvasBaseColor =
    currentPaperColor === defaultPaperColor
      ? 'var(--color-bg-canvas-warm)'
      : diarySettings.paperColor;
  const canvasStyle = {
    '--muwi-personal-canvas-color': canvasBaseColor,
  } as CSSProperties;
  const selectedDateLabel = currentEntry
    ? format(currentDate, diarySettings.dateFormat)
    : 'No entry selected';
  const wordCount = currentEntry ? (currentEntry.wordCount ?? countWordsFromContent(currentEntry.content)) : 0;
  const wordCountLabel = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
  const readTimeLabel = formatReadTime(wordCount);
  const statusDateLabel = currentEntry ? format(currentDate, diarySettings.dateFormat) : 'No entry selected';

  const toolbar = (
    <div
      className="muwi-personal-toolbar"
      data-testid="personal-diary-toolbar"
    >
      <span className="muwi-personal-toolbar__date">{selectedDateLabel}</span>
      <Button
        type="button"
        onClick={handleCreateNewEntry}
        variant="secondary"
        size="sm"
        disabled={isBusy || Boolean(error)}
      >
        New Entry
      </Button>
    </div>
  );

  const sidebar = (
    <EntryNavigation
      entries={entries}
      currentDate={currentDate}
      onDateChange={handleDateChange}
    />
  );
  const sidebarHeader = <p className="muwi-personal-nav__label">ENTRIES</p>;
  const sidebarFooter = (
    <Button
      type="button"
      onClick={handleGoToToday}
      variant="secondary"
      size="md"
      fullWidth
      className="muwi-personal-nav__today-action"
      disabled={isBusy || Boolean(error)}
      data-testid="personal-diary-today-action"
    >
      Today
    </Button>
  );

  const status = isBusy
    ? { left: 'Loading personal diary...', right: 'Preparing entries' }
    : error
      ? { left: 'Personal diary unavailable', right: 'Reload to retry' }
      : {
          left: statusDateLabel,
          right: `${wordCountLabel} · ${readTimeLabel}`,
        };

  const loadingCanvas = (
    <div className="muwi-personal-canvas__state" role="status" aria-live="polite">
      Loading...
    </div>
  );

  const errorCanvas = (
    <div className="muwi-personal-canvas__state is-error" role="alert">
      <p>Error: {error}</p>
      <Button type="button" onClick={() => window.location.reload()} variant="danger" size="sm">
        Reload
      </Button>
    </div>
  );

  const emptyCanvas = (
    <div className="muwi-personal-canvas__state is-empty" role="status" aria-live="polite">
      <p className="muwi-personal-canvas__title">No entry selected</p>
      <p className="muwi-personal-canvas__text">Create an entry to capture today&apos;s thoughts.</p>
      <Button
        type="button"
        onClick={handleGoToToday}
        variant="primary"
        size="md"
        className="muwi-personal-canvas__action"
      >
        Create today&apos;s entry
      </Button>
    </div>
  );

  const canvas = isBusy
    ? loadingCanvas
    : error
      ? errorCanvas
      : !currentEntry
        ? (
            <div
              className="muwi-personal-canvas"
              style={canvasStyle}
              data-testid="personal-diary-container"
            >
              {emptyCanvas}
            </div>
          )
      : (
          <div
            className="muwi-personal-canvas"
            style={canvasStyle}
            data-testid="personal-diary-container"
          >
            <DiaryEntry
              key={currentEntry?.id ?? 'empty-entry'}
              entry={currentEntry}
              onContentChange={handleContentChange}
              onDateChange={handleDateChange}
              onLockChange={handleLockChange}
              settings={diarySettings}
            />
          </div>
        );

  return (
    <DiaryLayout
      diaryType="personal-diary"
      sidebar={sidebar}
      sidebarHeader={sidebarHeader}
      sidebarFooter={sidebarFooter}
      toolbar={toolbar}
      canvas={canvas}
      status={status}
    />
  );
}
