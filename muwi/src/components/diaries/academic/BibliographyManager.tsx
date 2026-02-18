import { useState, useCallback, useMemo, memo } from 'react';
import {
  useAcademicStore,
  selectBibliographyEntries,
  selectCitationStyle,
} from '@/stores/academicStore';
import type { BibliographyEntry, BibliographyEntryType } from '@/types/academic';
import { formatBibliographyEntry, parseBibTeX, fetchFromDOI } from '@/utils/citation';

interface BibliographyManagerProps {
  onSelectEntry?: (entry: BibliographyEntry) => void;
  onClose?: () => void;
  hideHeader?: boolean;
}

const entryTypeLabels: Record<BibliographyEntryType, string> = {
  article: 'Journal Article',
  book: 'Book',
  chapter: 'Book Chapter',
  conference: 'Conference Paper',
  website: 'Website',
  thesis: 'Thesis',
  other: 'Other',
};

function parseDelimitedList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function BibliographyManager({ onSelectEntry, onClose, hideHeader = false }: BibliographyManagerProps) {
  const entries = useAcademicStore(selectBibliographyEntries);
  const citationStyle = useAcademicStore(selectCitationStyle);
  const addBibliographyEntry = useAcademicStore((state) => state.addBibliographyEntry);
  const updateBibliographyEntry = useAcademicStore((state) => state.updateBibliographyEntry);
  const deleteBibliographyEntry = useAcademicStore((state) => state.deleteBibliographyEntry);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'doi' | 'bibtex'>('manual');
  const [editingEntry, setEditingEntry] = useState<BibliographyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesTag = !selectedTag || entry.tags.includes(selectedTag);
      if (!matchesTag) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        entry.title.toLowerCase().includes(query) ||
        entry.authors.some((a) => a.toLowerCase().includes(query)) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        (entry.year && entry.year.toString().includes(query))
      );
    });
  }, [entries, searchQuery, selectedTag]);

  const availableTags = useMemo(
    () => Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort(),
    [entries]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this reference?')) {
        await deleteBibliographyEntry(id);
      }
    },
    [deleteBibliographyEntry]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      {!hideHeader && (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
            Reference Library
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#6B7280',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Search and Add */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Search references..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4A90A4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '4px 10px',
              border: selectedTag === null ? '1px solid #4A90A4' : '1px solid #E5E7EB',
              borderRadius: '999px',
              backgroundColor: selectedTag === null ? '#EFF6FF' : 'white',
              color: selectedTag === null ? '#4A90A4' : '#6B7280',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All tags
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '4px 10px',
                border: selectedTag === tag ? '1px solid #4A90A4' : '1px solid #E5E7EB',
                borderRadius: '999px',
                backgroundColor: selectedTag === tag ? '#EFF6FF' : 'white',
                color: selectedTag === tag ? '#4A90A4' : '#6B7280',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Entry List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredEntries.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: '14px',
            }}
          >
            {searchQuery ? 'No matching references' : 'No references yet. Add one to get started.'}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <BibliographyEntryItem
              key={entry.id}
              entry={entry}
              citationStyle={citationStyle}
              onSelect={() => onSelectEntry?.(entry)}
              onEdit={() => setEditingEntry(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddReferenceModal
          mode={addMode}
          setMode={setAddMode}
          isLoading={isLoading}
          error={error}
          onClose={() => {
            setShowAddModal(false);
            setError(null);
          }}
          onAdd={async (data) => {
            setIsLoading(true);
            setError(null);
            try {
              await addBibliographyEntry(data);
              setShowAddModal(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to add reference');
            } finally {
              setIsLoading(false);
            }
          }}
          onImportDOI={async (doi) => {
            setIsLoading(true);
            setError(null);
            try {
              const data = await fetchFromDOI(doi);
              await addBibliographyEntry(data as Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>);
              setShowAddModal(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to fetch DOI');
            } finally {
              setIsLoading(false);
            }
          }}
          onImportBibTeX={async (bibtex) => {
            setIsLoading(true);
            setError(null);
            try {
              const entries = parseBibTeX(bibtex);
              for (const entry of entries) {
                await addBibliographyEntry(entry as Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>);
              }
              setShowAddModal(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to parse BibTeX');
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <EditReferenceModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={async (updates) => {
            await updateBibliographyEntry(editingEntry.id, updates);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}

interface BibliographyEntryItemProps {
  entry: BibliographyEntry;
  citationStyle: string;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BibliographyEntryItem = memo(function BibliographyEntryItem({
  entry,
  citationStyle,
  onSelect,
  onEdit,
  onDelete,
}: BibliographyEntryItemProps) {
  const formattedEntry = useMemo(
    () => formatBibliographyEntry(entry, citationStyle as 'apa7'),
    [entry, citationStyle]
  );

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={onSelect}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              color: '#1F2937',
              lineHeight: 1.5,
            }}
            dangerouslySetInnerHTML={{ __html: formattedEntry }}
          />
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '6px',
              fontSize: '11px',
              color: '#9CA3AF',
            }}
          >
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: '#F3F4F6',
                borderRadius: '4px',
              }}
            >
              {entryTypeLabels[entry.type]}
            </span>
            {entry.tags.map((tag) => (
              <span
                key={`${entry.id}-${tag}`}
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '999px',
                  color: '#4A90A4',
                }}
              >
                #{tag}
              </span>
            ))}
            {entry.doi && <span>DOI: {entry.doi}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
            }}
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#DC2626',
            }}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

interface AddReferenceModalProps {
  mode: 'manual' | 'doi' | 'bibtex';
  setMode: (mode: 'manual' | 'doi' | 'bibtex') => void;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onAdd: (data: Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<void>;
  onImportDOI: (doi: string) => Promise<void>;
  onImportBibTeX: (bibtex: string) => Promise<void>;
}

function AddReferenceModal({
  mode,
  setMode,
  isLoading,
  error,
  onClose,
  onAdd,
  onImportDOI,
  onImportBibTeX,
}: AddReferenceModalProps) {
  const [formData, setFormData] = useState({
    type: 'article' as BibliographyEntryType,
    title: '',
    authors: '',
    year: new Date().getFullYear(),
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    doi: '',
    url: '',
    tags: '',
  });
  const [doiInput, setDoiInput] = useState('');
  const [bibtexInput, setBibtexInput] = useState('');

  const handleManualSubmit = () => {
    const authors = parseDelimitedList(formData.authors);
    const tags = parseDelimitedList(formData.tags);
    onAdd({
      type: formData.type,
      title: formData.title,
      authors,
      year: formData.year,
      journal: formData.journal || undefined,
      volume: formData.volume || undefined,
      issue: formData.issue || undefined,
      pages: formData.pages || undefined,
      publisher: formData.publisher || undefined,
      doi: formData.doi || undefined,
      url: formData.url || undefined,
      tags,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Add Reference</h3>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {(['manual', 'doi', 'bibtex'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                backgroundColor: mode === m ? 'white' : '#F9FAFB',
                borderBottom: mode === m ? '2px solid #4A90A4' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: mode === m ? 600 : 400,
                color: mode === m ? '#4A90A4' : '#6B7280',
              }}
            >
              {m === 'manual' ? 'Manual Entry' : m === 'doi' ? 'From DOI' : 'BibTeX'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {mode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BibliographyEntryType })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  {Object.entries(entryTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Authors * (comma or semicolon separated)
                </label>
                <input
                  type="text"
                  placeholder="Smith, John; Doe, Jane"
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Journal/Publisher
                  </label>
                  <input
                    type="text"
                    value={formData.journal}
                    onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Volume
                  </label>
                  <input
                    type="text"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Issue
                  </label>
                  <input
                    type="text"
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Pages
                  </label>
                  <input
                    type="text"
                    placeholder="1-10"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  DOI
                </label>
                <input
                  type="text"
                  placeholder="10.1000/xyz123"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Tags (comma or semicolon separated)
                </label>
                <input
                  type="text"
                  placeholder="ai, methods, review"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}

          {mode === 'doi' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                DOI
              </label>
              <input
                type="text"
                placeholder="10.1000/xyz123 or https://doi.org/10.1000/xyz123"
                value={doiInput}
                onChange={(e) => setDoiInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                Enter a DOI to automatically fetch reference details
              </p>
            </div>
          )}

          {mode === 'bibtex' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                BibTeX
              </label>
              <textarea
                placeholder="@article{key,
  author = {Smith, John},
  title = {Article Title},
  year = {2024}
}"
                value={bibtexInput}
                onChange={(e) => setBibtexInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  minHeight: '200px',
                  resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (mode === 'manual') handleManualSubmit();
              else if (mode === 'doi') onImportDOI(doiInput);
              else onImportBibTeX(bibtexInput);
            }}
            disabled={
              isLoading ||
              (mode === 'manual' && (!formData.title || !formData.authors)) ||
              (mode === 'doi' && !doiInput) ||
              (mode === 'bibtex' && !bibtexInput)
            }
            style={{
              padding: '8px 16px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Adding...' : 'Add Reference'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditReferenceModalProps {
  entry: BibliographyEntry;
  onClose: () => void;
  onSave: (updates: Partial<BibliographyEntry>) => Promise<void>;
}

function EditReferenceModal({ entry, onClose, onSave }: EditReferenceModalProps) {
  const [formData, setFormData] = useState({
    type: entry.type,
    title: entry.title,
    authors: entry.authors.join('; '),
    year: entry.year,
    journal: entry.journal || '',
    volume: entry.volume || '',
    issue: entry.issue || '',
    pages: entry.pages || '',
    publisher: entry.publisher || '',
    doi: entry.doi || '',
    url: entry.url || '',
    tags: entry.tags.join('; '),
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const authors = parseDelimitedList(formData.authors);
    const tags = parseDelimitedList(formData.tags);
    await onSave({
      type: formData.type,
      title: formData.title,
      authors,
      year: formData.year,
      journal: formData.journal || undefined,
      volume: formData.volume || undefined,
      issue: formData.issue || undefined,
      pages: formData.pages || undefined,
      publisher: formData.publisher || undefined,
      doi: formData.doi || undefined,
      url: formData.url || undefined,
      tags,
    });
    setIsSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Edit Reference</h3>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BibliographyEntryType })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                {Object.entries(entryTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Authors (semicolon separated)
              </label>
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Journal
                </label>
                <input
                  type="text"
                  value={formData.journal}
                  onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                DOI
              </label>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                />
              </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Tags (comma or semicolon separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
