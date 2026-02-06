import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  useAcademicStore,
  selectBibliographyEntries,
  selectCitationStyle,
  selectCurrentPaperId,
} from '@/stores/academicStore';
import type { BibliographyEntry } from '@/types/academic';
import { formatInTextCitation } from '@/utils/citation';

interface CitationPickerProps {
  onInsert: (citation: string, entry: BibliographyEntry) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function CitationPicker({ onInsert, onClose, position }: CitationPickerProps) {
  const entries = useAcademicStore(selectBibliographyEntries);
  const citationStyle = useAcademicStore(selectCitationStyle);
  const currentPaperId = useAcademicStore(selectCurrentPaperId);
  const addCitation = useAcademicStore((state) => state.addCitation);
  const loadBibliographyEntries = useAcademicStore((state) => state.loadBibliographyEntries);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BibliographyEntry | null>(null);
  const [pageNumbers, setPageNumbers] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load entries on mount
  useEffect(() => {
    loadBibliographyEntries();
  }, [loadBibliographyEntries]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.authors.some((a) => a.toLowerCase().includes(query)) ||
        (entry.year && entry.year.toString().includes(query))
    );
  }, [entries, searchQuery]);

  const handleInsert = useCallback(async () => {
    if (!selectedEntry || !currentPaperId) return;

    const formattedCitation = formatInTextCitation(selectedEntry, citationStyle, pageNumbers || undefined);

    // Add citation to the paper
    await addCitation(currentPaperId, selectedEntry.id, pageNumbers || undefined);

    // Insert the formatted citation
    onInsert(formattedCitation, selectedEntry);
    onClose();
  }, [selectedEntry, currentPaperId, citationStyle, pageNumbers, addCitation, onInsert, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filteredEntries.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedEntry) {
            handleInsert();
          } else if (filteredEntries[highlightedIndex]) {
            setSelectedEntry(filteredEntries[highlightedIndex]);
          }
          break;
        case 'Escape':
          if (selectedEntry) {
            setSelectedEntry(null);
          } else {
            onClose();
          }
          break;
      }
    },
    [filteredEntries, highlightedIndex, selectedEntry, handleInsert, onClose]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-entry]');
      const item = items[highlightedIndex] as HTMLElement | undefined;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div
      style={{
        position: position ? 'fixed' : 'relative',
        top: position?.y,
        left: position?.x,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        width: '400px',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
      onKeyDown={handleKeyDown}
    >
      {!selectedEntry ? (
        <>
          {/* Search header */}
          <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search references..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Entry list */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
            {filteredEntries.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: '13px',
                }}
              >
                {searchQuery ? 'No matching references' : 'No references in library'}
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  data-entry
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: index === highlightedIndex ? '#F3F4F6' : 'transparent',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1F2937',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.authors.slice(0, 2).join(', ')}
                    {entry.authors.length > 2 && ' et al.'}
                    {entry.year && ` (${entry.year})`}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #E5E7EB',
              fontSize: '11px',
              color: '#9CA3AF',
              display: 'flex',
              gap: '12px',
            }}
          >
            <span>
              <kbd style={{ padding: '2px 4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd style={{ padding: '2px 4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd style={{ padding: '2px 4px', backgroundColor: '#F3F4F6', borderRadius: '3px' }}>
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Selected entry details */}
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#6B7280',
                fontSize: '12px',
                marginBottom: '12px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to search
            </button>

            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1F2937',
                  marginBottom: '4px',
                }}
              >
                {selectedEntry.title}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                {selectedEntry.authors.join(', ')}
                {selectedEntry.year && ` (${selectedEntry.year})`}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#4B5563',
                  marginBottom: '4px',
                }}
              >
                Page numbers (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 45-47"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Preview
              </div>
              <div style={{ fontSize: '14px', color: '#1F2937' }}>
                {formatInTextCitation(selectedEntry, citationStyle, pageNumbers || undefined)}
              </div>
            </div>

            <button
              onClick={handleInsert}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#4A90A4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Insert Citation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
