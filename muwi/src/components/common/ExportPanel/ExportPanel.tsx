import { useState, useCallback } from 'react';
import { exportDocument, saveExport, type ExportOptions } from '@/utils/export';
import type { Section, LongDraft } from '@/types/longDrafts';
import type { Draft } from '@/types/drafts';
import type { AcademicPaper, AcademicSection, BibliographyEntry, CitationStyle } from '@/types/academic';
import { Modal } from '../Modal';
import { Button } from '../Button';

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
type ExportStage = 'idle' | 'generating' | 'saving';

const FORMAT_META: Record<ExportFormat, { icon: string; label: string }> = {
  pdf: { icon: '📄', label: 'PDF' },
  docx: { icon: '📝', label: 'DOCX' },
  tex: { icon: '📐', label: 'TEX' },
};

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
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [includeBibliography, setIncludeBibliography] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStage, setExportStage] = useState<ExportStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isTexFormat = format === 'tex';
  const supportsPageNumbers = !isTexFormat;
  const supportsHeaderFooter = !isTexFormat;
  const progressValue = exportStage === 'generating' ? 45 : exportStage === 'saving' ? 85 : 0;
  const progressLabel = exportStage === 'saving' ? 'Saving file...' : 'Generating export...';

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStage('generating');
    setError(null);
    setSuccess(null);

    try {
      const options: Partial<ExportOptions> = {
        format,
        pageSize,
        lineSpacing,
        fontSize,
        includeTitle,
        includePageNumbers: supportsPageNumbers ? includePageNumbers : false,
        includeHeader: supportsHeaderFooter ? includeHeader : false,
        includeFooter: supportsHeaderFooter ? includeFooter : false,
        headerText: supportsHeaderFooter ? headerText : '',
        footerText: supportsHeaderFooter ? footerText : '',
        includeBibliography,
      };

      const data = await exportDocument(
        documentType,
        {
          title: documentTitle,
          content,
          document: document as LongDraft | AcademicPaper,
          sections,
          bibliography,
          citationStyle,
        },
        options
      );

      const extension = format === 'tex' ? 'tex' : format;
      const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `${sanitizedTitle}.${extension}`;

      setExportStage('saving');
      const result = await saveExport(data as Uint8Array, filename);

      if (result) {
        setSuccess(`Successfully exported to ${filename}`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('Export cancelled or no save location selected.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportStage('idle');
    }
  }, [
    format,
    pageSize,
    lineSpacing,
    fontSize,
    includeTitle,
    includePageNumbers,
    includeHeader,
    includeFooter,
    headerText,
    footerText,
    includeBibliography,
    supportsPageNumbers,
    supportsHeaderFooter,
    documentType,
    documentTitle,
    content,
    document,
    sections,
    bibliography,
    citationStyle,
    onClose,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isExporting ? () => {} : onClose}
      title="Export Document"
      maxWidth={480}
      className="muwi-export-modal"
      closeButtonLabel="Close export panel"
      closeOnBackdropClick={!isExporting}
      closeOnEscape={!isExporting}
    >
      <div className="muwi-export-panel">
        <div className="muwi-export-panel__content">
          <section className="muwi-export-panel__section muwi-export-panel__document">
            <p className="muwi-export-panel__kicker">Exporting</p>
            <p className="muwi-export-panel__document-title">{documentTitle}</p>
          </section>

          {isExporting ? (
            <section role="status" className="muwi-export-panel__section muwi-export-panel__progress">
              <p className="muwi-export-panel__progress-label">{progressLabel}</p>
              <div
                role="progressbar"
                aria-label="Export progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressValue}
                className="muwi-export-panel__progress-track"
              >
                <div
                  className="muwi-export-panel__progress-fill"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </section>
          ) : null}

          <section className="muwi-export-panel__section">
            <p className="muwi-export-panel__label">Export Format</p>
            <div className="muwi-export-panel__format-grid">
              {(['pdf', 'docx', 'tex'] as const).map((nextFormat) => (
                <button
                  key={nextFormat}
                  type="button"
                  onClick={() => setFormat(nextFormat)}
                  className="muwi-export-panel__format-option"
                  data-selected={format === nextFormat ? 'true' : 'false'}
                  aria-label={FORMAT_META[nextFormat].label}
                >
                  <span className="muwi-export-panel__format-icon" aria-hidden="true">
                    {FORMAT_META[nextFormat].icon}
                  </span>
                  <span className="muwi-export-panel__format-label">{FORMAT_META[nextFormat].label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="muwi-export-panel__section muwi-export-panel__grid-2">
            <div className="muwi-field">
              <label htmlFor="export-page-size" className="muwi-field__label">Page Size</label>
              <select
                id="export-page-size"
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value as PageSize)}
                className="muwi-form-control"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter (US)</option>
              </select>
            </div>
            <div className="muwi-field">
              <label htmlFor="export-line-spacing" className="muwi-field__label">Line Spacing</label>
              <select
                id="export-line-spacing"
                value={lineSpacing}
                onChange={(event) => setLineSpacing(Number(event.target.value) as LineSpacing)}
                className="muwi-form-control"
              >
                <option value={1}>Single</option>
                <option value={1.5}>1.5</option>
                <option value={2}>Double</option>
              </select>
            </div>
          </section>

          <section className="muwi-export-panel__section">
            <label htmlFor="export-font-size" className="muwi-export-panel__label">
              Font Size: {fontSize}pt
            </label>
            <input
              id="export-font-size"
              type="range"
              min={10}
              max={14}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="muwi-export-panel__range"
            />
            <div className="muwi-export-panel__range-scale">
              <span>10pt</span>
              <span>14pt</span>
            </div>
          </section>

          <section className="muwi-export-panel__section">
            <p className="muwi-export-panel__label">Options</p>
            <div className="muwi-export-panel__options">
              <label className="muwi-export-panel__checkbox-row">
                <input
                  type="checkbox"
                  checked={includeTitle}
                  onChange={(event) => setIncludeTitle(event.target.checked)}
                />
                <span>Include title page</span>
              </label>

              {supportsPageNumbers ? (
                <label className="muwi-export-panel__checkbox-row">
                  <input
                    type="checkbox"
                    checked={includePageNumbers}
                    onChange={(event) => setIncludePageNumbers(event.target.checked)}
                  />
                  <span>Include page numbers</span>
                </label>
              ) : (
                <p className="muwi-export-panel__hint">
                  Page numbers and header/footer controls are not applied to LaTeX source output.
                </p>
              )}

              {supportsHeaderFooter ? (
                <>
                  <label className="muwi-export-panel__checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeHeader}
                      onChange={(event) => setIncludeHeader(event.target.checked)}
                    />
                    <span>Include header</span>
                  </label>
                  {includeHeader ? (
                    <input
                      type="text"
                      value={headerText}
                      onChange={(event) => setHeaderText(event.target.value)}
                      placeholder="Header text (optional)"
                      className="muwi-form-control"
                    />
                  ) : null}

                  <label className="muwi-export-panel__checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeFooter}
                      onChange={(event) => setIncludeFooter(event.target.checked)}
                    />
                    <span>Include footer</span>
                  </label>
                  {includeFooter ? (
                    <input
                      type="text"
                      value={footerText}
                      onChange={(event) => setFooterText(event.target.value)}
                      placeholder="Footer text (optional)"
                      className="muwi-form-control"
                    />
                  ) : null}
                </>
              ) : null}

              {documentType === 'academic' ? (
                <label className="muwi-export-panel__checkbox-row">
                  <input
                    type="checkbox"
                    checked={includeBibliography}
                    onChange={(event) => setIncludeBibliography(event.target.checked)}
                  />
                  <span>Include bibliography</span>
                </label>
              ) : null}
            </div>
          </section>

          {error ? (
            <div className="muwi-export-panel__alert" data-variant="error" role="alert" aria-live="assertive">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="muwi-export-panel__alert" data-variant="success" role="status" aria-live="polite">
              {success}
            </div>
          ) : null}
        </div>

        <footer className="muwi-export-panel__footer">
          <Button type="button" onClick={onClose} disabled={isExporting} variant="secondary" size="md">
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} disabled={isExporting} variant="primary" size="md">
            {isExporting ? (
              <span className="muwi-export-panel__exporting">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="muwi-export-panel__spinner"
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>{exportStage === 'saving' ? 'Saving...' : 'Exporting...'}</span>
              </span>
            ) : (
              `Export ${format.toUpperCase()}`
            )}
          </Button>
        </footer>
      </div>
    </Modal>
  );
}
