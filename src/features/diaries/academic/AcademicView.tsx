import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import type { DiaryScreenProps } from '../types';
import { useAcademic } from './useAcademic';
import { Bibliography } from './Bibliography';
import { RichText } from '../../../editors/tiptap/RichText';
import { MATH_TEMPLATES } from '../../../editors/tiptap/extensions/MathTemplates';
import type { Editor } from '@tiptap/core';

export function AcademicView({ diary }: DiaryScreenProps) {
  const {
    doc,
    citations,
    citationStyle,
    isLoading,
    error,
    updateDoc,
    addCitation,
    setCitationStyle,
    exportHtml,
    exportMarkdown,
  } = useAcademic(diary);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showCitationForm, setShowCitationForm] = useState(false);
  const [citationAuthor, setCitationAuthor] = useState('');
  const [citationTitle, setCitationTitle] = useState('');
  const [citationYear, setCitationYear] = useState(String(new Date().getFullYear()));
  const [citationUrl, setCitationUrl] = useState('');

  const resetCitationForm = useCallback(() => {
    setCitationAuthor('');
    setCitationTitle('');
    setCitationYear(String(new Date().getFullYear()));
    setCitationUrl('');
  }, []);

  const handleCitationStyleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      if (value === 'apa' || value === 'mla' || value === 'chicago') {
        setCitationStyle(value);
      }
    },
    [setCitationStyle],
  );

  const handleCitationSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const authors = citationAuthor
        .split(',')
        .map((author) => author.trim())
        .filter((author) => author.length > 0);

      if (authors.length === 0) {
        authors.push('Unknown Author');
      }

      const parsedYear = Number.parseInt(citationYear, 10);
      const yearValue = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

      addCitation({
        type: 'article',
        authors,
        title: citationTitle || 'Untitled Source',
        year: yearValue,
        url: citationUrl || undefined,
      });

      resetCitationForm();
      setShowCitationForm(false);
    },
    [addCitation, citationAuthor, citationTitle, citationYear, citationUrl, resetCitationForm],
  );

  const handleCitationCancel = useCallback(() => {
    resetCitationForm();
    setShowCitationForm(false);
  }, [resetCitationForm]);

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  const handleInsertMath = useCallback(
    (template: string) => {
      if (!editor) return;
      
      // Insert inline math
      editor.commands.setInlineMath(template);
      editor.commands.focus();
    },
    [editor]
  );

  const handleExportHtml = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const html = await exportHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diary.title || 'academic'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export HTML:', err);
    } finally {
      setIsExporting(false);
    }
  }, [exportHtml, diary.title, isExporting]);

  const handleExportMarkdown = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const markdown = await exportMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diary.title || 'academic'}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Markdown:', err);
    } finally {
      setIsExporting(false);
    }
  }, [exportMarkdown, diary.title, isExporting]);

  if (isLoading) {
    return (
      <section className="academic__status">
        <p>Loading academic document...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="academic__status academic__status--error">
        <p>Error: {error}</p>
      </section>
    );
  }

  return (
    <div className="academic">
      <aside className="academic__sidebar">
        <section className="academic__section">
          <h3 className="academic__section-title">Math Templates</h3>
          <div className="academic__templates">
            {Object.entries(MATH_TEMPLATES).map(([name, template]) => (
              <button
                key={name}
                className="academic__template"
                onClick={() => handleInsertMath(template)}
                title={template}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="academic__section">
          <div className="academic__section-header">
            <h3 className="academic__section-title">Citation Style</h3>
          </div>
          <select
            className="academic__style-select"
            value={citationStyle}
            onChange={handleCitationStyleChange}
          >
            <option value="apa">APA 7th</option>
            <option value="mla">MLA 9th</option>
            <option value="chicago">Chicago</option>
          </select>
        </section>

        <section className="academic__section">
          <div className="academic__section-header">
            <h3 className="academic__section-title">Citations ({citations.length})</h3>
            <button
              className="academic__add-citation"
              onClick={() => setShowCitationForm(true)}
              aria-label="Add citation"
              aria-expanded={showCitationForm}
              disabled={showCitationForm}
            >
              +
            </button>
          </div>
          {citations.length === 0 ? (
            <p className="academic__empty">No citations yet</p>
          ) : (
            <ul className="academic__citation-list">
              {citations.map((citation) => (
                <li key={citation.id} className="academic__citation-item">
                  <span className="academic__citation-author">
                    {citation.authors[0] || 'Unknown'}
                  </span>
                  <span className="academic__citation-year">({citation.year})</span>
                </li>
              ))}
            </ul>
          )}
          {showCitationForm && (
            <form className="academic__citation-form" onSubmit={handleCitationSubmit}>
              <label className="academic__citation-label">
                Authors
                <input
                  type="text"
                  className="academic__citation-input"
                  value={citationAuthor}
                  onChange={(event) => setCitationAuthor(event.target.value)}
                  placeholder="Separate multiple authors with commas"
                  autoFocus
                  required
                />
              </label>
              <label className="academic__citation-label">
                Title
                <input
                  type="text"
                  className="academic__citation-input"
                  value={citationTitle}
                  onChange={(event) => setCitationTitle(event.target.value)}
                  placeholder="Article or book title"
                  required
                />
              </label>
              <label className="academic__citation-label">
                Year
                <input
                  type="number"
                  className="academic__citation-input"
                  value={citationYear}
                  onChange={(event) => setCitationYear(event.target.value)}
                  min="0"
                  max="3000"
                  required
                />
              </label>
              <label className="academic__citation-label">
                URL (optional)
                <input
                  type="url"
                  className="academic__citation-input"
                  value={citationUrl}
                  onChange={(event) => setCitationUrl(event.target.value)}
                  placeholder="https://example.com"
                />
              </label>
              <div className="academic__citation-actions">
                <button type="submit" className="academic__citation-save">
                  Save citation
                </button>
                <button
                  type="button"
                  className="academic__citation-cancel"
                  onClick={handleCitationCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </aside>

      <main className="academic__main">
        <div className="academic__editor">
          <RichText
            value={doc}
            onChange={updateDoc}
            placeholder="Write your academic paper..."
            autofocus
            onEditorReady={handleEditorReady}
            schemaOptions={{
              placeholder: 'Start writing...',
            }}
          />
        </div>

        <div className="academic__bibliography">
          <Bibliography
            citations={citations}
            style={citationStyle}
          />
        </div>
      </main>

      <aside className="academic__actions">
        <button
          className="academic__action"
          onClick={handleExportHtml}
          disabled={isExporting}
          aria-label="Export as HTML"
        >
          Export HTML
        </button>
        <button
          className="academic__action"
          onClick={handleExportMarkdown}
          disabled={isExporting}
          aria-label="Export as Markdown"
        >
          Export Markdown
        </button>
      </aside>
    </div>
  );
}
