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

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--color-border-strong)',
  borderRadius: '6px',
  padding: '4px 8px',
  fontSize: '12px',
  backgroundColor: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)',
};

export function AcademicSectionEditor({
  section,
  onTitleChange,
  onContentChange,
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
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSettings = currentPaper?.settings;
  const lineSpacing = currentSettings?.lineSpacing ?? 2;
  const fontSize = currentSettings?.fontSize ?? 12;
  const marginPreset = getMarginPresetId(currentSettings?.margins);
  const fontFamily = (currentSettings?.fontFamily || 'Times New Roman').replace(/["']/g, '');
  const editorContainerPadding = Math.max(
    40,
    Math.round((currentSettings?.margins?.left ?? 25.4) * 1.6)
  );

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
          min-height: 400px;
          outline: none;
          font-family: '${fontFamily}', 'Times New Roman', 'Georgia', serif;
          font-size: ${fontSize}pt;
          line-height: ${lineSpacing};
          color: var(--color-text-primary);
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      setWordCount(countWords(text));
      setFigureCount(getHighestNumber(html, /Figure\s+(\d+)\./gi));
      setTableCount(getHighestNumber(html, /Table\s+(\d+)\./gi));
      setHeadingReferences(extractHeadingReferences(html));

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onContentChange(html);
      }, 500);
    },
  });

  useEditorShortcuts(editor, { includeUnderline: true, includeHeadings: true });

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          style: `
            min-height: 400px;
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
    const hasSelection = crossReferenceOptions.some(
      (option) => option.value === selectedCrossReference
    );
    return hasSelection ? selectedCrossReference : crossReferenceOptions[0].value;
  }, [crossReferenceOptions, selectedCrossReference]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcut for citation picker
  const openCitationPicker = useCallback(() => {
    // Get cursor position for positioning the picker
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }
      titleSaveTimeoutRef.current = setTimeout(() => {
        onTitleChange(newTitle);
      }, 500);
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
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          backgroundColor: 'var(--color-bg-secondary)',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ marginBottom: '16px', opacity: 0.5 }}
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <p style={{ fontSize: '16px', margin: 0 }}>Select a section or create a new one</p>
      </div>
    );
  }

  // Focus mode: simplified editor view
  if (isFocusMode) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '80px 48px',
            }}
          >
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Section Title"
              style={{
                width: '100%',
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: "'Times New Roman', 'Georgia', serif",
                color: 'var(--color-text-primary)',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                marginBottom: '32px',
                textAlign: 'center',
              }}
            />
            <EditorContent editor={editor} />
          </div>
        </div>

        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-primary)',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <span>{wordCount} words</span>
        </div>

        {showCitationPicker && (
          <CitationPicker
            onInsert={handleInsertCitation}
            onClose={() => setShowCitationPicker(false)}
            position={citationPickerPosition}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Header with title */}
      <div
        style={{
          padding: '20px 32px 16px',
          borderBottom: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Section Title"
          style={{
            width: '100%',
            fontSize: '22px',
            fontWeight: 700,
            fontFamily: "'Times New Roman', 'Georgia', serif",
            color: 'var(--color-text-primary)',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: 0,
            marginBottom: '8px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>{wordCount} words</span>
          <span>{figureCount} figures</span>
          <span>{tableCount} tables</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            Press{' '}
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              Ctrl+Shift+C
            </kbd>{' '}
            to insert citation
          </span>
        </div>

        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Line
            <select
              title="Line spacing"
              value={lineSpacing}
              disabled={!currentPaper}
              onChange={(e) =>
                updateAcademicSettings({
                  lineSpacing: Number.parseFloat(e.target.value),
                })
              }
              style={selectStyle}
            >
              <option value={1}>1.0</option>
              <option value={1.5}>1.5</option>
              <option value={2}>2.0</option>
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Font Size
            <select
              title="Font size"
              value={fontSize}
              disabled={!currentPaper}
              onChange={(e) =>
                updateAcademicSettings({
                  fontSize: Number.parseInt(e.target.value, 10),
                })
              }
              style={selectStyle}
            >
              <option value={10}>10pt</option>
              <option value={11}>11pt</option>
              <option value={12}>12pt</option>
              <option value={14}>14pt</option>
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Margins
            <select
              title="Margins"
              value={marginPreset}
              disabled={!currentPaper}
              onChange={(e) => {
                const selected = MARGIN_PRESETS.find((preset) => preset.id === e.target.value);
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
              style={selectStyle}
            >
              {MARGIN_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: `32px ${editorContainerPadding}px`,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Formatting toolbar */}
      {editor && (
        <div
          style={{
            padding: '10px 24px',
            borderTop: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-primary)',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
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

          {/* Citation button */}
          <ToolbarButton
            onClick={openCitationPicker}
            isActive={false}
            title="Insert Citation (Ctrl+Shift+C)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
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

          {showCrossReferencePanel && (
            <div
              data-testid="cross-reference-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: '8px',
                padding: '6px 8px',
                border: '1px solid var(--color-border-default)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <select
                aria-label="Cross-reference type"
                value={crossReferenceType}
                onChange={(e) =>
                  setCrossReferenceType(e.target.value as 'section' | 'figure' | 'table')
                }
                style={selectStyle}
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
                    onChange={(e) => setSelectedCrossReference(e.target.value)}
                    style={selectStyle}
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
                    style={{
                      padding: '5px 10px',
                      border: '1px solid var(--color-border-strong)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-bg-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Insert
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No references yet</span>
              )}
            </div>
          )}

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            title="Redo (Ctrl+Shift+Z)"
            disabled={!editor.can().redo()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      {/* Citation Picker */}
      {showCitationPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCitationPicker(false);
            }
          }}
        >
          <CitationPicker
            onInsert={handleInsertCitation}
            onClose={() => setShowCitationPicker(false)}
          />
        </div>
      )}
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
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
        color: disabled ? 'var(--color-border-strong)' : isActive ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        minWidth: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: '1px',
        height: '24px',
        backgroundColor: 'var(--color-border-default)',
        margin: '0 8px',
        alignSelf: 'center',
      }}
    />
  );
}
