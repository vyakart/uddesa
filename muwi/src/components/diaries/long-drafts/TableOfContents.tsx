import { useState, useCallback, memo, useMemo } from 'react';
import {
  useLongDraftsStore,
  selectCurrentLongDraftId,
  selectCurrentSectionId,
  selectSectionsMap,
  selectIsTOCVisible,
  type SectionNode,
} from '@/stores/longDraftsStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useContentLocking } from '@/hooks';
import { PasskeyPrompt } from '@/components/common';
import type { Section } from '@/types/longDrafts';

interface TableOfContentsProps {
  onCreateSection: (parentId?: string | null) => void;
  variant?: 'sidebar' | 'panel';
}

const statusColors: Record<string, string> = {
  draft: 'var(--color-text-tertiary)',
  'in-progress': 'var(--color-status-in-progress)',
  review: 'var(--color-status-review)',
  complete: 'var(--color-status-complete)',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In progress',
  review: 'In review',
  complete: 'Complete',
};

type SectionChildrenIndex = Map<string | null, Section[]>;

function buildSectionChildrenIndex(sections: Section[]): SectionChildrenIndex {
  const childrenIndex: SectionChildrenIndex = new Map();

  for (const section of sections) {
    const siblings = childrenIndex.get(section.parentId);
    if (siblings) {
      siblings.push(section);
    } else {
      childrenIndex.set(section.parentId, [section]);
    }
  }

  for (const siblings of childrenIndex.values()) {
    siblings.sort((a, b) => a.order - b.order);
  }

  return childrenIndex;
}

function buildSectionHierarchyFromIndex(
  childrenIndex: SectionChildrenIndex,
  parentId: string | null = null,
  depth: number = 0
): SectionNode[] {
  const siblings = childrenIndex.get(parentId) ?? [];
  return siblings.map((section) => ({
    section,
    depth,
    children: buildSectionHierarchyFromIndex(childrenIndex, section.id, depth + 1),
  }));
}

function flattenSectionIdsFromIndex(
  childrenIndex: SectionChildrenIndex,
  parentId: string | null = null,
  ids: string[] = []
): string[] {
  const siblings = childrenIndex.get(parentId) ?? [];
  for (const section of siblings) {
    ids.push(section.id);
    flattenSectionIdsFromIndex(childrenIndex, section.id, ids);
  }
  return ids;
}

function flattenSectionsByHierarchyOrder(sections: Section[]): string[] {
  return flattenSectionIdsFromIndex(buildSectionChildrenIndex(sections));
}

export function TableOfContents({ onCreateSection, variant = 'sidebar' }: TableOfContentsProps) {
  const isPanel = variant === 'panel';
  const currentLongDraftId = useLongDraftsStore(selectCurrentLongDraftId);
  const currentSectionId = useLongDraftsStore(selectCurrentSectionId);
  const isTOCVisible = useLongDraftsStore(selectIsTOCVisible);
  const sectionsMap = useLongDraftsStore(selectSectionsMap);
  const currentSections = currentLongDraftId ? (sectionsMap.get(currentLongDraftId) ?? []) : [];
  const sectionChildrenIndex = useMemo(() => buildSectionChildrenIndex(currentSections), [currentSections]);

  const sectionHierarchy = useMemo(() => {
    if (!currentLongDraftId) return [];
    return buildSectionHierarchyFromIndex(sectionChildrenIndex);
  }, [currentLongDraftId, sectionChildrenIndex]);

  const totalWordCount = useMemo(() => {
    if (!currentLongDraftId) return 0;
    return currentSections.reduce((total, section) => total + section.wordCount, 0);
  }, [currentLongDraftId, currentSections]);

  const setCurrentSection = useLongDraftsStore((state) => state.setCurrentSection);
  const toggleTOC = useLongDraftsStore((state) => state.toggleTOC);
  const deleteSection = useLongDraftsStore((state) => state.deleteSection);
  const updateSection = useLongDraftsStore((state) => state.updateSection);
  const reorderSections = useLongDraftsStore((state) => state.reorderSections);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const passkeyHint = useSettingsStore((state) => state.global.passkeyHint);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sectionId: string } | null>(null);
  const [unlockPromptSectionId, setUnlockPromptSectionId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dropTargetSectionId, setDropTargetSectionId] = useState<string | null>(null);

  const lockingTargetId = contextMenu?.sectionId ?? unlockPromptSectionId ?? '';
  const allSections = currentSections;
  const contextSection = contextMenu
    ? allSections.find((section) => section.id === contextMenu.sectionId) ?? null
    : null;

  const {
    lock,
    unlock,
    error: lockingError,
  } = useContentLocking({
    contentType: 'section',
    contentId: lockingTargetId,
    enabled: Boolean(lockingTargetId),
  });

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
    setExpandedSections((prev) => new Set(prev).add(parentId));
    setContextMenu(null);
  }, [onCreateSection]);

  const promptPasskeySetup = useCallback(() => {
    const shouldOpenSettings = confirm('A passkey is required to lock content. Open Settings to set one now?');
    if (shouldOpenSettings) {
      closeDiary();
      openSettings();
    }
  }, [closeDiary, openSettings]);

  const handleLockSection = useCallback(async (sectionId: string) => {
    const hasPass = await hasPasskey();
    if (!hasPass) {
      promptPasskeySetup();
      setContextMenu(null);
      return;
    }

    const isLocked = await lock();
    if (isLocked) {
      await updateSection(sectionId, { isLocked: true });
    }
    setContextMenu(null);
  }, [hasPasskey, lock, promptPasskeySetup, updateSection]);

  const handleUnlockSubmit = useCallback(async (passkey: string) => {
    if (!unlockPromptSectionId) {
      return;
    }

    const isUnlocked = await unlock(passkey);
    if (isUnlocked) {
      await updateSection(unlockPromptSectionId, { isLocked: false });
      setUnlockPromptSectionId(null);
    }
  }, [unlock, unlockPromptSectionId, updateSection]);

  const handleBackgroundClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  const resetDragState = useCallback(() => {
    setDraggedSectionId(null);
    setDropTargetSectionId(null);
  }, []);

  const handleDragStart = useCallback((sectionId: string) => {
    setDraggedSectionId(sectionId);
    setDropTargetSectionId(null);
    setContextMenu(null);
  }, []);

  const handleDragOverSection = useCallback((sectionId: string) => {
    if (!draggedSectionId || draggedSectionId === sectionId) {
      return;
    }
    setDropTargetSectionId(sectionId);
  }, [draggedSectionId]);

  const handleDropOnSection = useCallback(async (targetSectionId: string) => {
    if (!currentLongDraftId || !draggedSectionId || draggedSectionId === targetSectionId) {
      resetDragState();
      return;
    }

    const sections = sectionsMap.get(currentLongDraftId) ?? [];
    const draggedSection = sections.find((section) => section.id === draggedSectionId);
    const targetSection = sections.find((section) => section.id === targetSectionId);

    if (!draggedSection || !targetSection || draggedSection.parentId !== targetSection.parentId) {
      resetDragState();
      return;
    }

    const siblingSections = sections
      .filter((section) => section.parentId === targetSection.parentId)
      .sort((a, b) => a.order - b.order);
    const draggedIndex = siblingSections.findIndex((section) => section.id === draggedSectionId);
    const targetIndex = siblingSections.findIndex((section) => section.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      resetDragState();
      return;
    }

    const reorderedSiblings = [...siblingSections];
    const [movedSection] = reorderedSiblings.splice(draggedIndex, 1);
    reorderedSiblings.splice(targetIndex, 0, movedSection);

    const siblingOrderMap = new Map(reorderedSiblings.map((section, index) => [section.id, index]));
    const normalizedSections = sections.map((section) => {
      const nextOrder = siblingOrderMap.get(section.id);
      return nextOrder === undefined ? section : { ...section, order: nextOrder };
    });

    const allSectionIds = flattenSectionsByHierarchyOrder(normalizedSections);

    try {
      await reorderSections(currentLongDraftId, allSectionIds);
    } finally {
      resetDragState();
    }
  }, [currentLongDraftId, draggedSectionId, sectionsMap, reorderSections, resetDragState]);

  if (!isPanel && !isTOCVisible) {
    return (
      <div className="muwi-longdrafts-toc is-collapsed" data-testid="long-drafts-toc-collapsed">
        <button
          type="button"
          onClick={toggleTOC}
          className="muwi-sidebar-button"
          title="Show table of contents"
          aria-label="Show table of contents"
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
      data-testid="long-drafts-toc"
      onClick={handleBackgroundClick}
      className={[
        'muwi-longdrafts-toc',
        isPanel ? 'is-panel' : 'is-sidebar',
      ].join(' ')}
    >
      <div className="muwi-longdrafts-toc__header">
        <span className="muwi-longdrafts-toc__title">Contents</span>

        {!isPanel ? (
          <button
            type="button"
            onClick={toggleTOC}
            className="muwi-sidebar-button"
            title="Hide table of contents"
            aria-label="Hide table of contents"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="muwi-longdrafts-toc__toolbar-row">
        <button
          type="button"
          onClick={() => onCreateSection(null)}
          className="muwi-button"
          data-variant="primary"
          data-size="sm"
          style={{ width: '100%' }}
          aria-label="Add Section"
        >
          Add Section
        </button>
      </div>

      <div className="muwi-longdrafts-toc__tree">
        {sectionHierarchy.length === 0 ? (
          <div className="muwi-longdrafts-toc__empty">
            <p>No sections yet</p>
            <p>Add a section to start writing</p>
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
              onDragStart={handleDragStart}
              onDragOverSection={handleDragOverSection}
              onDropOnSection={handleDropOnSection}
              onDragEnd={resetDragState}
              draggedSectionId={draggedSectionId}
              dropTargetSectionId={dropTargetSectionId}
            />
          ))
        )}
      </div>

      <div className="muwi-longdrafts-toc__footer">
        <span>{sectionHierarchy.length} section{sectionHierarchy.length !== 1 ? 's' : ''}</span>
        <span>{totalWordCount.toLocaleString()} words</span>
      </div>

      {contextMenu ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => {
              if (!contextSection) {
                setContextMenu(null);
                return;
              }
              if (contextSection.isLocked) {
                setUnlockPromptSectionId(contextSection.id);
                setContextMenu(null);
                return;
              }
              void handleLockSection(contextSection.id);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: 'var(--color-text-primary)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {contextSection?.isLocked ? 'Unlock' : 'Lock'}
          </button>
          <div style={{ height: 1, backgroundColor: 'var(--color-border-default)' }} />
          <button
            onClick={() => handleAddSubsection(contextMenu.sectionId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: 'var(--color-text-primary)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
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
              color: 'var(--color-error)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-error-subtle)';
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
      ) : null}

      <PasskeyPrompt
        isOpen={unlockPromptSectionId !== null}
        onClose={() => setUnlockPromptSectionId(null)}
        onSubmit={handleUnlockSubmit}
        title="Unlock section"
        description="Enter your passkey to unlock this section."
        hint={passkeyHint}
        error={lockingError}
        submitLabel="Unlock"
      />
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
  onDragStart: (id: string) => void;
  onDragOverSection: (id: string) => void;
  onDropOnSection: (id: string) => Promise<void>;
  onDragEnd: () => void;
  draggedSectionId: string | null;
  dropTargetSectionId: string | null;
}

const TOCSectionItem = memo(function TOCSectionItem({
  node,
  isSelected,
  expandedSections,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragOverSection,
  onDropOnSection,
  onDragEnd,
  draggedSectionId,
  dropTargetSectionId,
}: TOCSectionItemProps) {
  const { section, children, depth } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedSections.has(section.id);
  const indentation = depth * 14;
  const isDragging = draggedSectionId === section.id;
  const isDropTarget = dropTargetSectionId === section.id && !isDragging;

  return (
    <div>
      <div
        data-testid={`toc-section-${section.id}`}
        role="button"
        tabIndex={0}
        draggable
        onClick={() => onSelect(section.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(section.id);
          }
        }}
        onContextMenu={(e) => onContextMenu(e, section.id)}
        onDragStart={() => onDragStart(section.id)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOverSection(section.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          void onDropOnSection(section.id);
        }}
        onDragEnd={onDragEnd}
        className={[
          'muwi-sidebar-item',
          'muwi-longdrafts-toc__item',
          isSelected ? 'is-active' : null,
          isDropTarget ? 'is-drop-target' : null,
          isDragging ? 'is-dragging' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `${10 + indentation}px` }}
      >
        <span className="muwi-longdrafts-toc__drag-handle" aria-hidden="true" title="Drag to reorder">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
          </svg>
        </span>

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(section.id);
            }}
            className="muwi-longdrafts-toc__expand"
            aria-label={isExpanded ? 'Collapse subsection' : 'Expand subsection'}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <span className="muwi-longdrafts-toc__expand-placeholder" aria-hidden="true" />
        )}

        <span
          className="muwi-longdrafts-toc__status-dot"
          style={{ backgroundColor: statusColors[section.status] || statusColors.draft }}
          title={statusLabels[section.status] || statusLabels.draft}
          aria-hidden="true"
        />
        <span className="muwi-visually-hidden">
          Status: {statusLabels[section.status] || statusLabels.draft}
        </span>

        <span className="muwi-longdrafts-toc__item-label" title={section.title}>
          {section.title || 'Untitled Section'}
        </span>

        <span className="muwi-longdrafts-toc__item-count">{section.wordCount}</span>

        {section.isLocked ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        ) : null}
      </div>

      {hasChildren && isExpanded ? (
        <div>
          {children.map((childNode) => (
            <TOCSectionItemWrapper
              key={childNode.section.id}
              node={childNode}
              expandedSections={expandedSections}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOverSection={onDragOverSection}
              onDropOnSection={onDropOnSection}
              onDragEnd={onDragEnd}
              draggedSectionId={draggedSectionId}
              dropTargetSectionId={dropTargetSectionId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

function TOCSectionItemWrapper({
  node,
  expandedSections,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragOverSection,
  onDropOnSection,
  onDragEnd,
  draggedSectionId,
  dropTargetSectionId,
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
      onDragStart={onDragStart}
      onDragOverSection={onDragOverSection}
      onDropOnSection={onDropOnSection}
      onDragEnd={onDragEnd}
      draggedSectionId={draggedSectionId}
      dropTargetSectionId={dropTargetSectionId}
    />
  );
}
