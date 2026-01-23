import { useState, useCallback, memo } from 'react';
import {
  useLongDraftsStore,
  selectCurrentLongDraftId,
  selectCurrentSectionId,
  selectIsTOCVisible,
  type SectionNode,
} from '@/stores/longDraftsStore';

interface TableOfContentsProps {
  onCreateSection: (parentId?: string | null) => void;
}

const statusColors: Record<string, string> = {
  draft: '#9CA3AF',
  'in-progress': '#F59E0B',
  review: '#3B82F6',
  complete: '#10B981',
};

export function TableOfContents({ onCreateSection }: TableOfContentsProps) {
  const currentLongDraftId = useLongDraftsStore(selectCurrentLongDraftId);
  const currentSectionId = useLongDraftsStore(selectCurrentSectionId);
  const isTOCVisible = useLongDraftsStore(selectIsTOCVisible);

  const sectionHierarchy = useLongDraftsStore((state) =>
    currentLongDraftId ? state.getSectionHierarchy(currentLongDraftId) : []
  );
  const totalWordCount = useLongDraftsStore((state) =>
    currentLongDraftId ? state.getTotalWordCount(currentLongDraftId) : 0
  );

  const setCurrentSection = useLongDraftsStore((state) => state.setCurrentSection);
  const toggleTOC = useLongDraftsStore((state) => state.toggleTOC);
  const deleteSection = useLongDraftsStore((state) => state.deleteSection);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sectionId: string } | null>(null);

  const toggleExpanded = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sectionId });
  }, []);

  const handleDelete = useCallback(async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section? Child sections will also be deleted.')) {
      await deleteSection(sectionId);
    }
    setContextMenu(null);
  }, [deleteSection]);

  const handleAddSubsection = useCallback((parentId: string) => {
    onCreateSection(parentId);
    // Ensure parent is expanded
    setExpandedSections((prev) => new Set(prev).add(parentId));
    setContextMenu(null);
  }, [onCreateSection]);

  // Close context menu on outside click
  const handleBackgroundClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  if (!isTOCVisible) {
    return (
      <div
        style={{
          width: '40px',
          height: '100%',
          backgroundColor: '#F9FAFB',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
        }}
      >
        <button
          onClick={toggleTOC}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
          title="Show table of contents"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        width: '260px',
        height: '100%',
        backgroundColor: '#F9FAFB',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Contents
        </span>
        <button
          onClick={toggleTOC}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
          title="Hide table of contents"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Add Section button */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <button
          onClick={() => onCreateSection(null)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#4A90A4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3D7A8C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4A90A4';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Section tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sectionHierarchy.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: '13px',
            }}
          >
            <p style={{ marginBottom: '8px' }}>No sections yet</p>
            <p style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Add a section to start writing
            </p>
          </div>
        ) : (
          sectionHierarchy.map((node) => (
            <TOCSectionItem
              key={node.section.id}
              node={node}
              isSelected={node.section.id === currentSectionId}
              expandedSections={expandedSections}
              onSelect={setCurrentSection}
              onToggleExpand={toggleExpanded}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Footer with total word count */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#6B7280' }}>
          {sectionHierarchy.length} section{sectionHierarchy.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>
          {totalWordCount.toLocaleString()} words
        </span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => handleAddSubsection(contextMenu.sectionId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#374151',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Subsection
          </button>
          <button
            onClick={() => handleDelete(contextMenu.sectionId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#DC2626',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete Section
          </button>
        </div>
      )}
    </div>
  );
}

interface TOCSectionItemProps {
  node: SectionNode;
  isSelected: boolean;
  expandedSections: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const TOCSectionItem = memo(function TOCSectionItem({
  node,
  isSelected,
  expandedSections,
  onSelect,
  onToggleExpand,
  onContextMenu,
}: TOCSectionItemProps) {
  const { section, children, depth } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedSections.has(section.id);
  const indentation = depth * 16;

  return (
    <div>
      <div
        onClick={() => onSelect(section.id)}
        onContextMenu={(e) => onContextMenu(e, section.id)}
        style={{
          padding: '8px 12px',
          paddingLeft: `${12 + indentation}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
          borderLeft: isSelected ? '3px solid #4A90A4' : '3px solid transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(section.id);
            }}
            style={{
              width: '16px',
              height: '16px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              color: '#9CA3AF',
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <div style={{ width: '16px' }} />
        )}

        {/* Status indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColors[section.status] || statusColors.draft,
            flexShrink: 0,
          }}
          title={section.status}
        />

        {/* Section title */}
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: depth === 0 ? 500 : 400,
            color: '#374151',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={section.title}
        >
          {section.title || 'Untitled Section'}
        </span>

        {/* Word count */}
        <span
          style={{
            fontSize: '11px',
            color: '#9CA3AF',
            flexShrink: 0,
          }}
        >
          {section.wordCount}
        </span>

        {/* Lock indicator */}
        {section.isLocked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((childNode) => (
            <TOCSectionItemWrapper
              key={childNode.section.id}
              node={childNode}
              expandedSections={expandedSections}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Wrapper to get current selection state from store for child items
function TOCSectionItemWrapper({
  node,
  expandedSections,
  onSelect,
  onToggleExpand,
  onContextMenu,
}: Omit<TOCSectionItemProps, 'isSelected'>) {
  const currentSectionId = useLongDraftsStore(selectCurrentSectionId);
  return (
    <TOCSectionItem
      node={node}
      isSelected={node.section.id === currentSectionId}
      expandedSections={expandedSections}
      onSelect={onSelect}
      onToggleExpand={onToggleExpand}
      onContextMenu={onContextMenu}
    />
  );
}
