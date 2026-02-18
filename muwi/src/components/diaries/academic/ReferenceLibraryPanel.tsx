import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  useAcademicStore,
  selectBibliographyEntries,
  selectCurrentPaperId,
  selectPapers,
} from '@/stores/academicStore';
import type { BibliographyEntry, BibliographyEntryType } from '@/types/academic';
import { BibliographyManager } from './BibliographyManager';

interface ReferenceLibraryPanelProps {
  onClose?: () => void;
}

const VALID_ENTRY_TYPES = new Set<BibliographyEntryType>([
  'article',
  'book',
  'chapter',
  'conference',
  'website',
  'thesis',
  'other',
]);

function parseDelimitedList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeImportedReference(
  raw: unknown
): Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const title = toStringOrUndefined(record.title);
  if (!title) return null;

  const yearValue = Number(record.year);
  const year = Number.isFinite(yearValue) && yearValue > 0 ? Math.floor(yearValue) : new Date().getFullYear();

  const rawType = toStringOrUndefined(record.type);
  const type: BibliographyEntryType = rawType && VALID_ENTRY_TYPES.has(rawType as BibliographyEntryType)
    ? (rawType as BibliographyEntryType)
    : 'other';

  const authors = Array.isArray(record.authors)
    ? record.authors
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
    : typeof record.authors === 'string'
      ? parseDelimitedList(record.authors)
      : [];

  const tags = Array.isArray(record.tags)
    ? record.tags
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
    : typeof record.tags === 'string'
      ? parseDelimitedList(record.tags)
      : [];

  return {
    type,
    title,
    authors: authors.length > 0 ? authors : ['Unknown'],
    year,
    journal: toStringOrUndefined(record.journal),
    volume: toStringOrUndefined(record.volume),
    issue: toStringOrUndefined(record.issue),
    pages: toStringOrUndefined(record.pages),
    publisher: toStringOrUndefined(record.publisher),
    doi: toStringOrUndefined(record.doi),
    url: toStringOrUndefined(record.url),
    bibtex: toStringOrUndefined(record.bibtex),
    tags,
  };
}

function extractImportRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { references?: unknown[] }).references)
  ) {
    return (payload as { references: unknown[] }).references;
  }
  throw new Error('Invalid import format. Expected an array or { references: [] }.');
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read import file.'));
    reader.readAsText(file);
  });
}

export function ReferenceLibraryPanel({ onClose }: ReferenceLibraryPanelProps) {
  const entries = useAcademicStore(selectBibliographyEntries);
  const papers = useAcademicStore(selectPapers);
  const currentPaperId = useAcademicStore(selectCurrentPaperId);
  const addBibliographyEntry = useAcademicStore((state) => state.addBibliographyEntry);
  const updatePaper = useAcademicStore((state) => state.updatePaper);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) || null,
    [entries, selectedEntryId]
  );

  useEffect(() => {
    if (!selectedEntryId) return;
    if (!entries.some((entry) => entry.id === selectedEntryId)) {
      setSelectedEntryId(null);
    }
  }, [entries, selectedEntryId]);

  const handleExport = useCallback(() => {
    if (entries.length === 0) {
      setStatusMessage('No references available to export.');
      return;
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      references: entries,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `muwi-references-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setStatusMessage(`Exported ${entries.length} reference${entries.length === 1 ? '' : 's'}.`);
  }, [entries]);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setStatusMessage(null);
      try {
        const content = await readFileText(file);
        const parsed = JSON.parse(content) as unknown;
        const records = extractImportRecords(parsed);

        let importedCount = 0;
        for (const record of records) {
          const normalized = normalizeImportedReference(record);
          if (!normalized) continue;
          await addBibliographyEntry(normalized);
          importedCount += 1;
        }

        setStatusMessage(
          importedCount > 0
            ? `Imported ${importedCount} reference${importedCount === 1 ? '' : 's'}.`
            : 'No valid references found in import file.'
        );
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : 'Failed to import references.'
        );
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    },
    [addBibliographyEntry]
  );

  const handleToggleLink = useCallback(
    async (paperId: string) => {
      if (!selectedEntry) return;

      const paper = papers.find((candidate) => candidate.id === paperId);
      if (!paper) return;

      const currentlyLinked = paper.bibliographyEntryIds.includes(selectedEntry.id);
      const bibliographyEntryIds = currentlyLinked
        ? paper.bibliographyEntryIds.filter((id) => id !== selectedEntry.id)
        : [...paper.bibliographyEntryIds, selectedEntry.id];

      await updatePaper(paper.id, { bibliographyEntryIds });
    },
    [papers, selectedEntry, updatePaper]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Reference Library</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Global references shared across papers
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '18px',
              lineHeight: 1,
            }}
            aria-label="Close reference library"
          >
            ×
          </button>
        )}
      </div>

      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          style={{
            padding: '6px 10px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {isImporting ? 'Importing...' : 'Import JSON'}
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '6px 10px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Export JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          data-testid="reference-import-input"
        />
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #E5E7EB',
            fontSize: '12px',
            color: '#4B5563',
            backgroundColor: '#F9FAFB',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, borderRight: '1px solid #E5E7EB' }}>
          <BibliographyManager hideHeader onSelectEntry={(entry) => setSelectedEntryId(entry.id)} />
        </div>
        <div
          style={{
            width: '220px',
            padding: '12px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>
            Link To Papers
          </div>
          {!selectedEntry ? (
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              Select a reference to link it to one or more papers.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: '#111827', marginBottom: '8px' }}>
                {selectedEntry.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {papers.map((paper) => {
                  const checked = paper.bibliographyEntryIds.includes(selectedEntry.id);
                  return (
                    <label
                      key={paper.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#374151',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          void handleToggleLink(paper.id);
                        }}
                      />
                      <span>
                        {paper.title}
                        {paper.id === currentPaperId ? ' (Current)' : ''}
                      </span>
                    </label>
                  );
                })}
                {papers.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    No papers available.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
