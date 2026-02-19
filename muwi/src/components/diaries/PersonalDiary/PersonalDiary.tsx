import { useEffect, useState, useCallback } from 'react';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { Button, DiaryLayout } from '@/components/common';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { EntryNavigation } from './EntryNavigation';
import { DiaryEntry } from './DiaryEntry';

// Helper to safely convert entry.date to Date object (handles both string and Date)
function toDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return parseISO(date);
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

  const paperBackground =
    diarySettings.paperTexture === 'paper-white'
      ? 'radial-gradient(circle at 84% 80%, rgba(0, 0, 0, 0.02) 0 1px, transparent 1px)'
      : 'radial-gradient(circle at 16% 14%, rgba(0, 0, 0, 0.03) 0 1px, transparent 1px)';

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
  const selectedDateLabel = currentEntry
    ? format(currentDate, diarySettings.dateFormat)
    : 'No entry selected';

  const toolbar = (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
      data-testid="personal-diary-toolbar"
    >
      <span style={{ fontSize: '0.875rem', color: '#666666' }}>{selectedDateLabel}</span>
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

  const status = isBusy
    ? { left: 'Loading personal diary...', right: 'Preparing entries' }
    : error
      ? { left: 'Personal diary unavailable', right: 'Reload to retry' }
      : {
          left: `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`,
          right: currentEntry?.isLocked ? 'Locked' : 'Unlocked',
        };

  const loadingCanvas = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#888888',
      }}
    >
      Loading...
    </div>
  );

  const errorCanvas = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#F44336',
        gap: '16px',
      }}
    >
      <p>Error: {error}</p>
      <Button type="button" onClick={() => window.location.reload()} variant="danger" size="sm">
        Reload
      </Button>
    </div>
  );

  const canvas = isBusy
    ? loadingCanvas
    : error
      ? errorCanvas
      : (
          <div
            style={{
              display: 'flex',
              height: '100%',
              overflow: 'hidden',
              background: `${paperBackground}, ${diarySettings.paperColor}`,
              backgroundSize: '160px 160px',
            }}
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
      toolbar={toolbar}
      canvas={canvas}
      status={status}
    />
  );
}
