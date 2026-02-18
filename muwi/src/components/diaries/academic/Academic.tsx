import { useEffect, useState, useCallback } from 'react';
import { DiaryLayout } from '@/components/common/DiaryLayout';
import {
  useAcademicStore,
  selectPapers,
  selectCurrentPaperId,
  selectCurrentPaper,
  selectAcademicCurrentSections,
  selectAcademicCurrentSection,
  selectAcademicIsLoading,
  selectAcademicError,
  selectAcademicIsTOCVisible,
  selectIsBibliographyPanelVisible,
  selectCitationStyle,
  selectCurrentPaperWordCount,
  type AcademicSectionNode,
} from '@/stores/academicStore';
import type { CitationStyle, PaperCreationOptions } from '@/types/academic';
import { AcademicSectionEditor } from './AcademicSectionEditor';
import { ReferenceLibraryPanel } from './ReferenceLibraryPanel';
import { TemplateSelector } from './TemplateSelector';

const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa7: 'APA 7th',
  mla9: 'MLA 9th',
  chicago: 'Chicago',
  harvard: 'Harvard',
  ieee: 'IEEE',
};

function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function Academic() {
  const papers = useAcademicStore(selectPapers);
  const currentPaperId = useAcademicStore(selectCurrentPaperId);
  const currentPaper = useAcademicStore(selectCurrentPaper);
  const currentSections = useAcademicStore(selectAcademicCurrentSections);
  const currentSection = useAcademicStore(selectAcademicCurrentSection);
  const isLoading = useAcademicStore(selectAcademicIsLoading);
  const error = useAcademicStore(selectAcademicError);
  const isTOCVisible = useAcademicStore(selectAcademicIsTOCVisible);
  const isBibliographyPanelVisible = useAcademicStore(selectIsBibliographyPanelVisible);
  const citationStyle = useAcademicStore(selectCitationStyle);
  const totalWordCount = useAcademicStore(selectCurrentPaperWordCount);
  const totalCharacterCount = currentSections.reduce(
    (total, section) => total + stripHtml(section.content).length,
    0
  );

  const loadPapers = useAcademicStore((state) => state.loadPapers);
  const loadBibliographyEntries = useAcademicStore((state) => state.loadBibliographyEntries);
  const createPaper = useAcademicStore((state) => state.createPaper);
  const setCurrentPaper = useAcademicStore((state) => state.setCurrentPaper);
  const createSection = useAcademicStore((state) => state.createSection);
  const updateSection = useAcademicStore((state) => state.updateSection);
  const deleteSection = useAcademicStore((state) => state.deleteSection);
  const setCurrentSection = useAcademicStore((state) => state.setCurrentSection);
  const toggleTOC = useAcademicStore((state) => state.toggleTOC);
  const toggleBibliographyPanel = useAcademicStore((state) => state.toggleBibliographyPanel);
  const setCitationStyle = useAcademicStore((state) => state.setCitationStyle);
  const getSectionHierarchy = useAcademicStore((state) => state.getSectionHierarchy);

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPaperList, setShowPaperList] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadPapers();
    loadBibliographyEntries();
  }, [loadPapers, loadBibliographyEntries]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.ProseMirror') instanceof HTMLElement);

      if (isMod && e.key === 'n') {
        e.preventDefault();
        setShowTemplateSelector(true);
      }
      if (isMod && e.key === 'b' && !isEditable) {
        e.preventDefault();
        toggleBibliographyPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleBibliographyPanel]);

  const handleCreatePaper = useCallback(
    async (title: string, template: string | null, options?: PaperCreationOptions) => {
      if (options) {
        await createPaper(title, template || undefined, options);
      } else {
        await createPaper(title, template || undefined);
      }
      setShowTemplateSelector(false);
    },
    [createPaper]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (currentSection) {
        updateSection(currentSection.id, { title });
      }
    },
    [currentSection, updateSection]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentSection) {
        updateSection(currentSection.id, { content });
      }
    },
    [currentSection, updateSection]
  );

  const handleAddSection = useCallback(async () => {
    if (currentPaperId) {
      await createSection(currentPaperId);
    }
  }, [currentPaperId, createSection]);

  const handleDeleteSection = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this section?')) {
        await deleteSection(id);
      }
    },
    [deleteSection]
  );

  const sectionHierarchy = currentPaperId ? getSectionHierarchy(currentPaperId) : [];

  // Toolbar component
  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      {/* Paper selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPaperList(!showPaperList)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#374151',
            cursor: 'pointer',
            maxWidth: '200px',
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentPaper?.title || 'Select Paper'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showPaperList && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              zIndex: 50,
              minWidth: '200px',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            {papers.map((paper) => (
              <button
                key={paper.id}
                onClick={() => {
                  setCurrentPaper(paper.id);
                  setShowPaperList(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: paper.id === currentPaperId ? '#F3F4F6' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                }}
              >
                {paper.title}
              </button>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', padding: '8px' }}>
              <button
                onClick={() => {
                  setShowPaperList(false);
                  setShowTemplateSelector(true);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#4A90A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                + New Paper
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Word/character count */}
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        {totalWordCount} words · {totalCharacterCount} chars
      </span>

      <div style={{ flex: 1 }} />

      {/* Citation style selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6B7280',
            cursor: 'pointer',
          }}
        >
          {CITATION_STYLE_LABELS[citationStyle]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showStyleMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              zIndex: 50,
              minWidth: '120px',
            }}
          >
            {(Object.keys(CITATION_STYLE_LABELS) as CitationStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => {
                  setCitationStyle(style);
                  setShowStyleMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: style === citationStyle ? '#F3F4F6' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {CITATION_STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOC toggle */}
      <button
        onClick={toggleTOC}
        title="Toggle Table of Contents"
        style={{
          padding: '6px 10px',
          backgroundColor: isTOCVisible ? '#EFF6FF' : 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          cursor: 'pointer',
          color: isTOCVisible ? '#4A90A4' : '#6B7280',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Bibliography toggle */}
      <button
        onClick={toggleBibliographyPanel}
        title="Toggle Bibliography Panel"
        style={{
          padding: '6px 10px',
          backgroundColor: isBibliographyPanelVisible ? '#EFF6FF' : 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          cursor: 'pointer',
          color: isBibliographyPanelVisible ? '#4A90A4' : '#6B7280',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <DiaryLayout diaryType="academic" toolbar={toolbar}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #E5E7EB',
                borderTopColor: '#4A90A4',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading...
          </div>
        </div>
      </DiaryLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DiaryLayout diaryType="academic" toolbar={toolbar}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', color: '#DC2626' }}>
            <p style={{ marginBottom: '16px' }}>{error}</p>
            <button
              onClick={loadPapers}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4A90A4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </DiaryLayout>
    );
  }

  // Empty state
  if (papers.length === 0) {
    return (
      <DiaryLayout diaryType="academic" toolbar={toolbar}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ marginBottom: '16px', opacity: 0.5 }}
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No academic papers yet</p>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>
            Create your first paper to get started
          </p>
          <button
            onClick={() => setShowTemplateSelector(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Academic Paper
          </button>
        </div>

        {showTemplateSelector && (
          <TemplateSelector onSelect={handleCreatePaper} onClose={() => setShowTemplateSelector(false)} />
        )}
      </DiaryLayout>
    );
  }

  return (
    <DiaryLayout diaryType="academic" toolbar={toolbar}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Table of Contents */}
        {isTOCVisible && (
          <div
            style={{
              width: '260px',
              borderRight: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Sections
              </h3>
              <button
                onClick={handleAddSection}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#4A90A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {sectionHierarchy.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    fontSize: '13px',
                  }}
                >
                  No sections yet
                </div>
              ) : (
                <SectionList
                  nodes={sectionHierarchy}
                  currentSectionId={currentSection?.id || null}
                  onSelect={setCurrentSection}
                  onDelete={handleDeleteSection}
                />
              )}
            </div>
          </div>
        )}

        {/* Main editor */}
        <AcademicSectionEditor
          key={currentSection?.id ?? 'empty-academic-section'}
          section={currentSection}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
        />

        {/* Reference library panel */}
        {isBibliographyPanelVisible && (
          <div
            style={{
              width: '560px',
              borderLeft: '1px solid #E5E7EB',
            }}
          >
            <ReferenceLibraryPanel onClose={toggleBibliographyPanel} />
          </div>
        )}
      </div>

      {/* Template selector modal */}
      {showTemplateSelector && (
        <TemplateSelector onSelect={handleCreatePaper} onClose={() => setShowTemplateSelector(false)} />
      )}
    </DiaryLayout>
  );
}

// Section list component for TOC
interface SectionListProps {
  nodes: AcademicSectionNode[];
  currentSectionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function SectionList({ nodes, currentSectionId, onSelect, onDelete }: SectionListProps) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.section.id}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              paddingLeft: `${12 + node.depth * 16}px`,
              borderRadius: '6px',
              backgroundColor: currentSectionId === node.section.id ? '#EFF6FF' : 'transparent',
              cursor: 'pointer',
              marginBottom: '2px',
            }}
            onClick={() => onSelect(node.section.id)}
          >
            <span
              style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: currentSectionId === node.section.id ? 600 : 400,
                color: currentSectionId === node.section.id ? '#4A90A4' : '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.section.title || 'Untitled'}
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px' }}>
              {node.section.wordCount}w
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.section.id);
              }}
              style={{
                padding: '2px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#9CA3AF',
                marginLeft: '4px',
                opacity: 0.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.color = '#9CA3AF';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {node.children.length > 0 && (
            <SectionList
              nodes={node.children}
              currentSectionId={currentSectionId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </div>
  );
}
