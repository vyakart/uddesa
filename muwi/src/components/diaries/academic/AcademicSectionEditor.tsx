import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import type { AcademicSection, AcademicSettings } from '@/types/academic';
import { useEditorShortcuts } from '@/hooks';
import {
  useAcademicStore,
  selectAcademicViewMode,
  selectCurrentPaper,
} from '@/stores/academicStore';
import { CitationPicker } from './CitationPicker';
import { useCitationShortcut } from './useCitationShortcut';

interface AcademicSectionEditorProps {
  section: AcademicSection | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onOpenBibliographyPanel?: () => void;
  onOpenReferenceLibraryPanel?: () => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ');
}

function getHighestNumber(content: string, pattern: RegExp): number {
  let max = 0;
  let match = pattern.exec(content);
  while (match) {
    max = Math.max(max, Number.parseInt(match[1], 10) || 0);
    match = pattern.exec(content);
  }
  return max;
}

function marginMmToPx(mm: number | undefined): number {
  if (!mm) {
    return 64;
  }

  return Math.max(32, Math.round((mm / 25.4) * 96 * 0.72));
}

interface HeadingReference {
  id: string;
  label: string;
}

function extractHeadingReferences(content: string): HeadingReference[] {
  const headings: HeadingReference[] = [];
  const matches = content.matchAll(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi);
  let index = 1;

  for (const match of matches) {
    const text = stripHtml(match[2]).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    headings.push({
      id: `section-${index}`,
      label: text,
    });
    index += 1;
  }

  return headings;
}

interface MarginPreset {
  id: string;
  label: string;
  value: number;
}

const MARGIN_PRESETS: MarginPreset[] = [
  { id: 'narrow', label: 'Narrow (0.75in)', value: 19.05 },
  { id: 'normal', label: 'Normal (1in)', value: 25.4 },
  { id: 'wide', label: 'Wide (1.25in)', value: 31.75 },
];

function getMarginPresetId(margins: AcademicSettings['margins'] | undefined): string {
  if (!margins) return 'normal';
  const match = MARGIN_PRESETS.find((preset) => Math.abs(preset.value - margins.top) < 0.001);
  return match?.id || 'normal';
}

const PAGE_WIDTH: Record<'a4' | 'letter', string> = {
  a4: '860px',
  letter: '890px',
};

const controlStyle: React.CSSProperties = {
  border: '1px solid var(--color-border-default)',
  borderRadius: '6px',
  padding: '4px 8px',
  fontSize: '12px',
  backgroundColor: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)',
};

const METRICS_UPDATE_DEBOUNCE_MS = 150;
const CONTENT_SAVE_DEBOUNCE_MS = 500;

export function AcademicSectionEditor({
  section,
  onTitleChange,
  onContentChange,
  onOpenBibliographyPanel,
  onOpenReferenceLibraryPanel,
}: AcademicSectionEditorProps) {
  const viewMode = useAcademicStore(selectAcademicViewMode);
  const currentPaper = useAcademicStore(selectCurrentPaper);
  const updatePaper = useAcademicStore((state) => state.updatePaper);
  const isFocusMode = viewMode === 'focus';

  const [title, setTitle] = useState(() => section?.title || '');
  const [wordCount, setWordCount] = useState(() => countWords(stripHtml(section?.content || '')));
  const [figureCount, setFigureCount] = useState(() =>
    getHighestNumber(section?.content || '', /Figure\s+(\d+)\./gi)
  );
  const [tableCount, setTableCount] = useState(() =>
    getHighestNumber(section?.content || '', /Table\s+(\d+)\./gi)
  );
  const [headingReferences, setHeadingReferences] = useState<HeadingReference[]>(() =>
    extractHeadingReferences(section?.content || '')
  );
  const [showCitationPicker, setShowCitationPicker] = useState(false);
  const [citationPickerPosition, setCitationPickerPosition] = useState<{ x: number; y: number } | undefined>();
  const [showCrossReferencePanel, setShowCrossReferencePanel] = useState(false);
  const [crossReferenceType, setCrossReferenceType] = useState<'section' | 'figure' | 'table'>('figure');
  const [selectedCrossReference, setSelectedCrossReference] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metricsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSettings = currentPaper?.settings;
  const lineSpacing = currentSettings?.lineSpacing ?? 2;
  const fontSize = currentSettings?.fontSize ?? 12;
  const marginPreset = getMarginPresetId(currentSettings?.margins);
  const fontFamily = (currentSettings?.fontFamily || 'Times New Roman').replace(/["']/g, '');
  const pageSize = currentSettings?.pageSize ?? 'a4';

  const contentPaddingTop = marginMmToPx(currentSettings?.margins?.top);
  const contentPaddingRight = marginMmToPx(currentSettings?.margins?.right);
  const contentPaddingBottom = marginMmToPx(currentSettings?.margins?.bottom);
  const contentPaddingLeft = marginMmToPx(currentSettings?.margins?.left);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing this section...',
      }),
      Underline,
    ],
    content: section?.content || '',
    editorProps: {
      attributes: {
        style: `
          min-height: 420px;
          outline: none;
          font-family: '${fontFamily}', 'Times New Roman', 'Georgia', serif;
          font-size: ${fontSize}pt;
          line-height: ${lineSpacing};
          color: var(--color-text-primary);
        `,
      },
    },
    onUpdate: ({ editor }) => {
      if (metricsTimeoutRef.current) {
        clearTimeout(metricsTimeoutRef.current);
      }
      metricsTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const text = editor.getText();

        setWordCount(countWords(text));
        setFigureCount(getHighestNumber(html, /Figure\s+(\d+)\./gi));
        setTableCount(getHighestNumber(html, /Table\s+(\d+)\./gi));
        setHeadingReferences(extractHeadingReferences(html));
      }, METRICS_UPDATE_DEBOUNCE_MS);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        onContentChange(html);
      }, CONTENT_SAVE_DEBOUNCE_MS);
    },
  });

  useEditorShortcuts(editor, { includeUnderline: true, includeHeadings: true });

  useEffect(() => {
    if (!editor) return;

    editor.setOptions({
      editorProps: {
        attributes: {
          style: `
            min-height: 420px;
            outline: none;
            font-family: '${fontFamily}', 'Times New Roman', 'Georgia', serif;
            font-size: ${fontSize}pt;
            line-height: ${lineSpacing};
            color: var(--color-text-primary);
          `,
        },
      },
    });
  }, [editor, fontFamily, fontSize, lineSpacing]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (metricsTimeoutRef.current) clearTimeout(metricsTimeoutRef.current);
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    };
  }, []);

  const crossReferenceOptions = useMemo(() => {
    if (crossReferenceType === 'section') {
      return headingReferences.map((heading) => ({
        value: heading.id,
        label: heading.label,
      }));
    }

    const count = crossReferenceType === 'figure' ? figureCount : tableCount;
    return Array.from({ length: count }, (_, index) => ({
      value: String(index + 1),
      label: `${crossReferenceType === 'figure' ? 'Figure' : 'Table'} ${index + 1}`,
    }));
  }, [crossReferenceType, headingReferences, figureCount, tableCount]);

  const effectiveCrossReferenceTarget = useMemo(() => {
    if (crossReferenceOptions.length === 0) return '';

    const hasSelection = crossReferenceOptions.some((option) => option.value === selectedCrossReference);
    return hasSelection ? selectedCrossReference : crossReferenceOptions[0].value;
  }, [crossReferenceOptions, selectedCrossReference]);

  const openCitationPicker = useCallback(() => {
    if (editor) {
      const { view } = editor;
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);
      setCitationPickerPosition({ x: coords.left, y: coords.bottom + 10 });
    }

    setShowCitationPicker(true);
  }, [editor]);

  useCitationShortcut(openCitationPicker);

  const handleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = event.target.value;
      setTitle(newTitle);

      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }

      titleSaveTimeoutRef.current = setTimeout(() => {
        onTitleChange(newTitle);
      }, CONTENT_SAVE_DEBOUNCE_MS);
    },
    [onTitleChange]
  );

  const handleInsertCitation = useCallback(
    (citation: string) => {
      if (editor) {
        editor.chain().focus().insertContent(citation).run();
      }
      setShowCitationPicker(false);
    },
    [editor]
  );

  const handleInsertFigure = useCallback(() => {
    if (!editor) return;

    const nextFigureNumber = figureCount + 1;
    editor
      .chain()
      .focus()
      .insertContent(`<p><strong>Figure ${nextFigureNumber}.</strong> Figure caption.</p>`)
      .run();
    setFigureCount(nextFigureNumber);
  }, [editor, figureCount]);

  const handleInsertTable = useCallback(() => {
    if (!editor) return;

    const nextTableNumber = tableCount + 1;
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><strong>Table ${nextTableNumber}.</strong> Table caption.</p><table><tbody><tr><td>Cell</td><td>Cell</td></tr></tbody></table>`
      )
      .run();
    setTableCount(nextTableNumber);
  }, [editor, tableCount]);

  const handleInsertCrossReference = useCallback(() => {
    if (!editor || !effectiveCrossReferenceTarget) return;

    if (crossReferenceType === 'section') {
      const targetSection = crossReferenceOptions.find(
        (option) => option.value === effectiveCrossReferenceTarget
      );

      if (targetSection) {
        editor.chain().focus().insertContent(`see Section "${targetSection.label}"`).run();
      }
    } else {
      const prefix = crossReferenceType === 'figure' ? 'Figure' : 'Table';
      editor.chain().focus().insertContent(`see ${prefix} ${effectiveCrossReferenceTarget}`).run();
    }

    setShowCrossReferencePanel(false);
  }, [editor, crossReferenceOptions, crossReferenceType, effectiveCrossReferenceTarget]);

  const updateAcademicSettings = useCallback(
    (updates: Partial<AcademicSettings>) => {
      if (!currentPaper) return;

      void updatePaper(currentPaper.id, {
        settings: {
          ...currentPaper.settings,
          ...updates,
        },
      });
    },
    [currentPaper, updatePaper]
  );

  if (!section) {
    return (
      <div className="muwi-academic-editor__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <p>Select a section or create a new one</p>
      </div>
    );
  }

  if (isFocusMode) {
    return (
      <div className="muwi-academic-editor muwi-academic-editor--focus">
        <div className="muwi-academic-editor__focus-surface">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Section Title"
            className="muwi-academic-editor__focus-title"
          />
          <EditorContent editor={editor} />
        </div>

        <div className="muwi-academic-editor__focus-footer">
          <span>{wordCount} words</span>
        </div>

        {showCitationPicker ? (
          <CitationPicker
            onInsert={handleInsertCitation}
            onClose={() => setShowCitationPicker(false)}
            position={citationPickerPosition}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="muwi-academic-editor">
      <div className="muwi-academic-editor__header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Section Title"
          className="muwi-academic-editor__title"
        />

        <div className="muwi-academic-editor__metrics">
          <span>{wordCount} words</span>
          <span>{figureCount} figures</span>
          <span>{tableCount} tables</span>
          <span>
            Press <kbd>Ctrl+Shift+C</kbd> to insert citation
          </span>
        </div>
      </div>

      {editor ? (
        <div className="muwi-academic-editor__toolbar" role="toolbar" aria-label="Academic formatting toolbar">
          <div className="muwi-academic-editor__toolbar-controls">
            <label>
              Line
              <select
                title="Line spacing"
                value={lineSpacing}
                disabled={!currentPaper}
                onChange={(event) =>
                  updateAcademicSettings({
                    lineSpacing: Number.parseFloat(event.target.value),
                  })
                }
                style={controlStyle}
              >
                <option value={1}>1.0</option>
                <option value={1.5}>1.5</option>
                <option value={2}>2.0</option>
              </select>
            </label>

            <label>
              Font
              <select
                title="Font size"
                value={fontSize}
                disabled={!currentPaper}
                onChange={(event) =>
                  updateAcademicSettings({
                    fontSize: Number.parseInt(event.target.value, 10),
                  })
                }
                style={controlStyle}
              >
                <option value={10}>10pt</option>
                <option value={11}>11pt</option>
                <option value={12}>12pt</option>
                <option value={14}>14pt</option>
              </select>
            </label>

            <label>
              Margins
              <select
                title="Margins"
                value={marginPreset}
                disabled={!currentPaper}
                onChange={(event) => {
                  const selected = MARGIN_PRESETS.find((preset) => preset.id === event.target.value);
                  if (!selected) return;

                  updateAcademicSettings({
                    margins: {
                      top: selected.value,
                      right: selected.value,
                      bottom: selected.value,
                      left: selected.value,
                    },
                  });
                }}
                style={controlStyle}
              >
                {MARGIN_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1 (Ctrl+1)"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2 (Ctrl+2)"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3 (Ctrl+3)"
          >
            H3
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="4" cy="6" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="4" cy="18" r="2" />
              <rect x="8" y="5" width="14" height="2" />
              <rect x="8" y="11" width="14" height="2" />
              <rect x="8" y="17" width="14" height="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <text x="2" y="8" fontSize="8" fontFamily="sans-serif">
                1.
              </text>
              <text x="2" y="14" fontSize="8" fontFamily="sans-serif">
                2.
              </text>
              <text x="2" y="20" fontSize="8" fontFamily="sans-serif">
                3.
              </text>
              <rect x="10" y="5" width="12" height="2" />
              <rect x="10" y="11" width="12" height="2" />
              <rect x="10" y="17" width="12" height="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Block Quote"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={openCitationPicker}
            isActive={false}
            title="Insert Citation (Ctrl+Shift+C)"
          >
            Cite
          </ToolbarButton>
          <ToolbarButton
            onClick={handleInsertFigure}
            isActive={false}
            title="Insert Figure"
          >
            Fig +
          </ToolbarButton>
          <ToolbarButton
            onClick={handleInsertTable}
            isActive={false}
            title="Insert Table"
          >
            Tbl +
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowCrossReferencePanel((visible) => !visible)}
            isActive={showCrossReferencePanel}
            title="Insert Cross-reference"
          >
            X-Ref
          </ToolbarButton>

          {onOpenBibliographyPanel ? (
            <ToolbarButton
              onClick={onOpenBibliographyPanel}
              isActive={false}
              title="Open Bibliography Panel"
            >
              Biblio
            </ToolbarButton>
          ) : null}
          {onOpenReferenceLibraryPanel ? (
            <ToolbarButton
              onClick={onOpenReferenceLibraryPanel}
              isActive={false}
              title="Open Reference Library Panel"
            >
              Library
            </ToolbarButton>
          ) : null}

          {showCrossReferencePanel ? (
            <div data-testid="cross-reference-panel" className="muwi-academic-editor__xref-panel">
              <select
                aria-label="Cross-reference type"
                value={crossReferenceType}
                onChange={(event) => setCrossReferenceType(event.target.value as 'section' | 'figure' | 'table')}
                style={controlStyle}
              >
                <option value="section">Section</option>
                <option value="figure">Figure</option>
                <option value="table">Table</option>
              </select>

              {crossReferenceOptions.length > 0 ? (
                <>
                  <select
                    aria-label="Cross-reference target"
                    value={effectiveCrossReferenceTarget}
                    onChange={(event) => setSelectedCrossReference(event.target.value)}
                    style={controlStyle}
                  >
                    {crossReferenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleInsertCrossReference}
                    className="muwi-button"
                    data-size="sm"
                    data-variant="secondary"
                  >
                    Insert
                  </button>
                </>
              ) : (
                <span>No references yet</span>
              )}
            </div>
          ) : null}

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
          >
            Undo
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            title="Redo (Ctrl+Shift+Z)"
            disabled={!editor.can().redo()}
          >
            Redo
          </ToolbarButton>
        </div>
      ) : null}

      <div className="muwi-academic-editor__canvas">
        <div className="muwi-academic-editor__page-wrap">
          <article className="muwi-academic-editor__page" style={{ maxWidth: PAGE_WIDTH[pageSize] }}>
            <header className="muwi-academic-editor__zone">Header zone</header>

            <div
              className="muwi-academic-editor__page-content"
              style={{
                paddingTop: `${contentPaddingTop}px`,
                paddingRight: `${contentPaddingRight}px`,
                paddingBottom: `${contentPaddingBottom}px`,
                paddingLeft: `${contentPaddingLeft}px`,
              }}
            >
              <EditorContent editor={editor} />
            </div>

            <footer className="muwi-academic-editor__zone">Footer zone</footer>
          </article>
        </div>
      </div>

      {showCitationPicker ? (
        <div
          className="muwi-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowCitationPicker(false);
            }
          }}
        >
          <CitationPicker onInsert={handleInsertCitation} onClose={() => setShowCitationPicker(false)} />
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
  disabled = false,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const showLabel = typeof children === 'string';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="muwi-toolbar__button"
      data-active={isActive ? 'true' : 'false'}
      data-icon-only={showLabel ? 'false' : 'true'}
    >
      {showLabel ? (
        <span className="muwi-toolbar__label">{children}</span>
      ) : (
        <span className="muwi-toolbar__icon" aria-hidden="true">
          {children}
        </span>
      )}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="muwi-toolbar__separator" aria-hidden="true" />;
}
