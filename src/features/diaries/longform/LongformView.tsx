import { useState, useCallback, useRef, useEffect } from 'react';
import type { DiaryScreenProps } from '../types';
import { useLongform } from './useLongform';
import { useOutline } from './useOutline';
import { RichText } from '../../../editors/tiptap/RichText';
import { LongformOutline } from '../../../ui/LongformOutline';
import { extractFootnotes } from '../../../editors/tiptap/extensions/Footnote';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';

export function LongformView({ diary }: DiaryScreenProps) {
  const { doc, isLoading, error, updateDoc, exportHtml, exportMarkdown } = useLongform(diary);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const { outline } = useOutline(editor);
  const footnotes = editor ? extractFootnotes(editor.getJSON()) : [];

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  const handleNavigate = useCallback(
    (headingId: string, position: number) => {
      if (!editor) return;

      // Find the node at the position and scroll to it
      const node = editor.state.doc.nodeAt(position);
      if (node) {
        // Focus the editor and scroll to position
        editor.commands.focus(position);
        
        // Scroll the container into view
        if (editorContainerRef.current) {
          const editorElement = editorContainerRef.current.querySelector('[contenteditable]');
          if (editorElement) {
            editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }

        setActiveHeadingId(headingId);
      }
    },
    [editor],
  );

  // Track active heading based on scroll position
  useEffect(() => {
    if (!editor || outline.length === 0) {
      return;
    }

    const handleScroll = () => {
      // This would ideally check scroll position and update activeHeadingId
      // For now, we'll leave this as a placeholder for future enhancement
    };

    const container = editorContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [editor, outline]);

  const handleExportHtml = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const html = await exportHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diary.title || 'longform'}.html`;
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
      link.download = `${diary.title || 'longform'}.md`;
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
      <section className="longform__status">
        <p>Loading document...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="longform__status longform__status--error">
        <p>Error: {error}</p>
      </section>
    );
  }

  return (
    <div className="longform">
      <aside className="longform__sidebar">
        <LongformOutline
          outline={outline}
          activeId={activeHeadingId}
          onNavigate={handleNavigate}
        />
      </aside>

      <main className="longform__main">
        <div className="longform__editor" ref={editorContainerRef}>
          <RichText
            value={doc}
            onChange={updateDoc}
            placeholder="Start writing your long-form document..."
            autofocus
            onEditorReady={handleEditorReady}
            schemaOptions={{
              placeholder: 'Write your document...',
            }}
          />
        </div>

        {footnotes.length > 0 && (
          <footer className="longform__footnotes">
            <h3 className="longform__footnotes-title">Footnotes</h3>
            <ol className="longform__footnotes-list">
              {footnotes.map((footnote) => (
                <li key={footnote.id} className="longform__footnote">
                  <sup className="longform__footnote-number">{footnote.number}</sup>
                  <span className="longform__footnote-content">{footnote.content}</span>
                </li>
              ))}
            </ol>
          </footer>
        )}
      </main>

      <aside className="longform__actions">
        <button
          className="longform__action"
          onClick={handleExportHtml}
          disabled={isExporting}
          aria-label="Export as HTML"
        >
          Export HTML
        </button>
        <button
          className="longform__action"
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
