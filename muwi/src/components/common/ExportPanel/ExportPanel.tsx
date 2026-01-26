import { useState, useCallback } from 'react';
import {
  exportDocument,
  saveExport,
  type ExportOptions,
} from '@/utils/export';
import type { Section, LongDraft } from '@/types/longDrafts';
import type { Draft } from '@/types/drafts';
import type { AcademicPaper, AcademicSection, BibliographyEntry, CitationStyle } from '@/types/academic';

type DocumentType = 'draft' | 'longDraft' | 'academic';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  documentTitle: string;
  content?: string;
  document?: LongDraft | AcademicPaper | Draft;
  sections?: Section[] | AcademicSection[];
  bibliography?: BibliographyEntry[];
  citationStyle?: CitationStyle;
}

type ExportFormat = 'pdf' | 'docx' | 'tex';
type PageSize = 'a4' | 'letter';
type LineSpacing = 1 | 1.5 | 2;

export function ExportPanel({
  isOpen,
  onClose,
  documentType,
  documentTitle,
  content,
  document,
  sections,
  bibliography,
  citationStyle = 'apa7',
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(1.5);
  const [fontSize, setFontSize] = useState(12);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeBibliography, setIncludeBibliography] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const options: Partial<ExportOptions> = {
        format,
        pageSize,
        lineSpacing,
        fontSize,
        includeTitle,
        includePageNumbers,
        includeBibliography,
      };

      const data = await exportDocument(documentType, {
        title: documentTitle,
        content,
        document: document as LongDraft | AcademicPaper,
        sections,
        bibliography,
        citationStyle,
      }, options);

      // Generate filename
      const extension = format === 'tex' ? 'tex' : format;
      const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `${sanitizedTitle}.${extension}`;

      // Save file
      const result = await saveExport(data as Uint8Array, filename);

      if (result) {
        setSuccess(`Successfully exported to ${filename}`);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [
    format,
    pageSize,
    lineSpacing,
    fontSize,
    includeTitle,
    includePageNumbers,
    includeBibliography,
    documentType,
    documentTitle,
    content,
    document,
    sections,
    bibliography,
    citationStyle,
    onClose,
  ]);

  if (!isOpen) return null;

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
          width: '480px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
            Export Document
          </h2>
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
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Document info */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
              Exporting
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
              {documentTitle}
            </div>
          </div>

          {/* Format selection */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '10px',
              }}
            >
              Export Format
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['pdf', 'docx', 'tex'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: `2px solid ${format === f ? '#4A90A4' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    backgroundColor: format === f ? '#EFF6FF' : 'white',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                    {f === 'pdf' ? '📄' : f === 'docx' ? '📝' : '📐'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: format === f ? 600 : 400,
                      color: format === f ? '#4A90A4' : '#6B7280',
                    }}
                  >
                    {f.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Page settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter (US)</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Line Spacing
              </label>
              <select
                value={lineSpacing}
                onChange={(e) => setLineSpacing(Number(e.target.value) as LineSpacing)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value={1}>Single</option>
                <option value={1.5}>1.5</option>
                <option value={2}>Double</option>
              </select>
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Font Size: {fontSize}pt
            </label>
            <input
              type="range"
              min={10}
              max={14}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF' }}>
              <span>10pt</span>
              <span>14pt</span>
            </div>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Options
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={includeTitle}
                  onChange={(e) => setIncludeTitle(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Include title page</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={includePageNumbers}
                  onChange={(e) => setIncludePageNumbers(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Include page numbers</span>
              </label>
              {documentType === 'academic' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeBibliography}
                    onChange={(e) => setIncludeBibliography(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>Include bibliography</span>
                </label>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#F0FDF4',
                borderRadius: '8px',
                color: '#16A34A',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '10px 24px',
              backgroundColor: isExporting ? '#9CA3AF' : '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isExporting ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
