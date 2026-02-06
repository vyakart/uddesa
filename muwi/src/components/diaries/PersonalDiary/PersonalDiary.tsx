import { useEffect, useState, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { DiaryLayout } from '@/components/common';
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
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const entries = usePersonalDiaryStore((state) => state.entries);
  const currentEntry = usePersonalDiaryStore((state) => state.currentEntry);
  const error = usePersonalDiaryStore((state) => state.error);
  const loadEntries = usePersonalDiaryStore((state) => state.loadEntries);
  const loadEntry = usePersonalDiaryStore((state) => state.loadEntry);
  const updateEntry = usePersonalDiaryStore((state) => state.updateEntry);
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

  const handleToggleCollapse = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <DiaryLayout diaryType="personal-diary">
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
      </DiaryLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DiaryLayout diaryType="personal-diary">
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
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: '1px solid #F44336',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#F44336',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </DiaryLayout>
    );
  }

  return (
    <DiaryLayout diaryType="personal-diary" showToolbar={false}>
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
        {/* Entry Navigation Sidebar */}
        <EntryNavigation
          entries={entries}
          currentDate={currentEntry ? toDate(currentEntry.date) : new Date()}
          onDateChange={handleDateChange}
          isCollapsed={isNavCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main Editor Area */}
        <DiaryEntry
          key={currentEntry?.id ?? 'empty-entry'}
          entry={currentEntry}
          onContentChange={handleContentChange}
          onDateChange={handleDateChange}
          settings={diarySettings}
        />
      </div>
    </DiaryLayout>
  );
}
