import { format, isToday, isSameDay, addDays, subDays, parseISO } from 'date-fns';
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function EntryNavigation({
  entries,
  currentDate,
  onDateChange,
  isCollapsed = false,
  onToggleCollapse,
}: EntryNavigationProps) {
  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          width: '48px',
          height: '100%',
          borderRight: '1px solid #E0E0E0',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#666666',
          }}
          aria-label="Expand navigation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        borderRight: '1px solid #E0E0E0',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with navigation buttons */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Collapse button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '0.875rem' }}>
            Entries
          </span>
          <button
            onClick={onToggleCollapse}
            style={{
              padding: '4px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#666666',
            }}
            aria-label="Collapse navigation"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Day navigation */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handlePrevDay}
            style={{
              flex: 1,
              padding: '6px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#666666',
            }}
            aria-label="Previous day"
          >
            &larr; Prev
          </button>
          <button
            onClick={handleToday}
            style={{
              flex: 1,
              padding: '6px',
              border: '1px solid #4A90A4',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#4A90A4',
              fontWeight: 500,
            }}
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            style={{
              flex: 1,
              padding: '6px',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#666666',
            }}
            aria-label="Next day"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Entry List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {entries.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: '#888888',
              fontSize: '0.875rem',
              padding: '24px 12px',
            }}
          >
            No entries yet. Start writing today!
          </p>
        ) : (
          entries.map((entry) => {
            const entryDate = toDate(entry.date);
            const isSelected = isSameDay(entryDate, currentDate);
            const isTodayEntry = isToday(entryDate);

            return (
              <button
                key={entry.id}
                onClick={() => onDateChange(entryDate)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#E8F4F8' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#4A90A4' : '#1A1A1A',
                      fontSize: '0.875rem',
                    }}
                  >
                    {format(entryDate, 'MMM d, yyyy')}
                  </span>
                  {isTodayEntry && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#4A90A4',
                        color: '#FFFFFF',
                        fontWeight: 500,
                      }}
                    >
                      TODAY
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#888888',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '160px',
                    }}
                  >
                    {entry.content
                      ? entry.content.replace(/<[^>]*>/g, '').slice(0, 40) +
                        (entry.content.length > 40 ? '...' : '')
                      : 'Empty entry'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: '#AAAAAA',
                    }}
                  >
                    {entry.wordCount} words
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
