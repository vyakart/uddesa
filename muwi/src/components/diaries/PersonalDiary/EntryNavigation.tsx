import { useMemo } from 'react';
import { format, isToday, isSameDay, parseISO } from 'date-fns';
import type { DiaryEntry } from '@/types/diary';

// Helper to safely convert entry.date to Date object (handles both string and Date)
function toDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return parseISO(date);
}

interface EntryNavigationProps {
  entries: DiaryEntry[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

interface EntryGroup {
  key: string;
  label: string;
  entries: DiaryEntry[];
}

const MOOD_COLOR_MAP: Record<string, string> = {
  happy: 'var(--color-success)',
  excited: 'var(--color-warning)',
  calm: 'var(--color-info)',
  neutral: 'var(--color-text-tertiary)',
  sad: 'var(--color-error)',
};

function groupEntriesByMonth(entries: DiaryEntry[]): EntryGroup[] {
  const sorted = [...entries].sort((a, b) => {
    const left = toDate(a.date).getTime();
    const right = toDate(b.date).getTime();
    return right - left;
  });

  const groups: EntryGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const entry of sorted) {
    const entryDate = toDate(entry.date);
    const key = format(entryDate, 'yyyy-MM');
    const label = format(entryDate, 'MMMM yyyy');

    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({ key, label, entries: [] });
    }

    const groupIndex = indexByKey.get(key);
    if (groupIndex === undefined) {
      continue;
    }
    groups[groupIndex].entries.push(entry);
  }

  return groups;
}

function getEntryPreview(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plainText) {
    return 'Empty entry';
  }
  return plainText.slice(0, 56) + (plainText.length > 56 ? '...' : '');
}

function getMoodColor(mood?: string): string | null {
  if (!mood) {
    return null;
  }
  const normalizedMood = mood.toLowerCase();
  return MOOD_COLOR_MAP[normalizedMood] ?? 'var(--color-accent-default)';
}

export function EntryNavigation({ entries, currentDate, onDateChange }: EntryNavigationProps) {
  const groupedEntries = useMemo(() => groupEntriesByMonth(entries), [entries]);

  return (
    <div className="muwi-personal-nav" data-testid="personal-entry-navigation">
      {groupedEntries.length === 0 ? (
        <p className="muwi-personal-nav__empty">No entries yet. Start writing today!</p>
      ) : (
        groupedEntries.map((group) => (
          <section key={group.key} className="muwi-personal-nav__group" aria-label={group.label}>
            <h3 className="muwi-personal-nav__group-header">{group.label}</h3>
            <div className="muwi-personal-nav__group-items">
              {group.entries.map((entry) => {
                const entryDate = toDate(entry.date);
                const isSelected = isSameDay(entryDate, currentDate);
                const isTodayEntry = isToday(entryDate);
                const moodColor = getMoodColor(entry.mood);
                const preview = getEntryPreview(entry.content);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onDateChange(entryDate)}
                    className="muwi-personal-nav__entry"
                    data-active={isSelected ? 'true' : 'false'}
                    title={format(entryDate, 'PPPP')}
                  >
                    <span className="muwi-personal-nav__entry-head">
                      <span className="muwi-personal-nav__entry-date-wrap">
                        {moodColor ? (
                          <span
                            className="muwi-personal-nav__mood-dot"
                            style={{ backgroundColor: moodColor }}
                            title={`Mood: ${entry.mood}`}
                          />
                        ) : null}
                        <span className="muwi-personal-nav__entry-date">{format(entryDate, 'MMM d, yyyy')}</span>
                      </span>
                      {isTodayEntry ? <span className="muwi-personal-nav__today-pill">Today</span> : null}
                    </span>
                    <span className="muwi-personal-nav__entry-preview">{preview}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
