import { useEffect, useState, useCallback } from 'react';
import { DiaryLayout } from '@/components/common';
import { usePersonalDiaryStore } from '@/stores/personalDiaryStore';
import { EntryNavigation } from './EntryNavigation';
import { DiaryEntry } from './DiaryEntry';

export function PersonalDiary() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const entries = usePersonalDiaryStore((state) => state.entries);
  const currentEntry = usePersonalDiaryStore((state) => state.currentEntry);
  const isLoading = usePersonalDiaryStore((state) => state.isLoading);
  const loadEntries = usePersonalDiaryStore((state) => state.loadEntries);
  const loadEntry = usePersonalDiaryStore((state) => state.loadEntry);
  const updateEntry = usePersonalDiaryStore((state) => state.updateEntry);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Load today's entry on mount
  useEffect(() => {
    loadEntry(new Date());
  }, [loadEntry]);

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

  if (isLoading && !currentEntry) {
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

  return (
    <DiaryLayout diaryType="personal-diary" showToolbar={false}>
      <div
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Entry Navigation Sidebar */}
        <EntryNavigation
          entries={entries}
          currentDate={currentEntry?.date || new Date()}
          onDateChange={handleDateChange}
          isCollapsed={isNavCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main Editor Area */}
        <DiaryEntry
          entry={currentEntry}
          onContentChange={handleContentChange}
          onDateChange={handleDateChange}
        />
      </div>
    </DiaryLayout>
  );
}
