import { useState, useCallback } from 'react';
import type { DiaryScreenProps } from '../types';
import { useDrafts } from './useDrafts';
import { RichText } from '../../../editors/tiptap/RichText';
import { WordCount } from '../../../ui/WordCount';
import type { Editor } from '@tiptap/core';

export function DraftsView({ diary }: DiaryScreenProps) {
  const { doc, isLoading, error, updateDoc, exportHtml, exportMarkdown } = useDrafts(diary);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  const handleExportHtml = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const html = await exportHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diary.title || 'draft'}.html`;
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
      link.download = `${diary.title || 'draft'}.md`;
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
      <section className="drafts__status">
        <p>Loading draft...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="drafts__status drafts__status--error">
        <p>Error: {error}</p>
      </section>
    );
  }

  return (
    <div className="drafts">
      <div className="drafts__editor">
        <RichText
          value={doc}
          onChange={updateDoc}
          placeholder="Start writing..."
          autofocus
          onEditorReady={handleEditorReady}
          schemaOptions={{
            placeholder: 'Write your draft...',
            includeTitle: true,
          }}
        />
      </div>
      <footer className="drafts__footer">
        <WordCount editor={editor} />
        <div className="drafts__actions">
          <button
            className="drafts__action"
            onClick={handleExportHtml}
            disabled={isExporting}
            aria-label="Export as HTML"
          >
            Export HTML
          </button>
          <button
            className="drafts__action"
            onClick={handleExportMarkdown}
            disabled={isExporting}
            aria-label="Export as Markdown"
          >
            Export Markdown
          </button>
        </div>
      </footer>
    </div>
  );
}
