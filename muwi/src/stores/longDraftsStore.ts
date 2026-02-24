import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LongDraft, Section, Footnote } from '@/types/longDrafts';
import * as longDraftsQueries from '@/db/queries/longDrafts';

const SECTION_METADATA_SYNC_DEBOUNCE_MS = 300;
const pendingDocumentMetadataSyncs = new Map<string, ReturnType<typeof setTimeout>>();

function cancelScheduledDocumentMetadataSync(longDraftId: string): void {
  const timer = pendingDocumentMetadataSyncs.get(longDraftId);
  if (!timer) return;
  clearTimeout(timer);
  pendingDocumentMetadataSyncs.delete(longDraftId);
}

function scheduleDocumentMetadataSync(longDraftId: string, get: () => LongDraftsState): void {
  cancelScheduledDocumentMetadataSync(longDraftId);
  const timer = setTimeout(() => {
    pendingDocumentMetadataSyncs.delete(longDraftId);
    void get().updateDocumentMetadata(longDraftId);
  }, SECTION_METADATA_SYNC_DEBOUNCE_MS);
  pendingDocumentMetadataSyncs.set(longDraftId, timer);
}

export function __resetLongDraftMetadataSyncSchedulerForTests(): void {
  for (const timer of pendingDocumentMetadataSyncs.values()) {
    clearTimeout(timer);
  }
  pendingDocumentMetadataSyncs.clear();
}

export type ViewMode = 'normal' | 'focus';
export type SectionStatus = 'draft' | 'in-progress' | 'review' | 'complete';

interface LongDraftsState {
  // Documents state
  longDrafts: LongDraft[];
  currentLongDraftId: string | null;

  // Sections state (keyed by longDraftId)
  sectionsMap: Map<string, Section[]>;
  currentSectionId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  isTOCVisible: boolean;

  // Actions - Documents
  loadLongDrafts: () => Promise<void>;
  loadLongDraft: (id: string) => Promise<void>;
  createLongDraft: (title?: string) => Promise<LongDraft>;
  updateLongDraft: (id: string, updates: Partial<LongDraft>) => Promise<void>;
  deleteLongDraft: (id: string) => Promise<void>;
  setCurrentLongDraft: (id: string | null) => void;

  // Actions - Sections
  loadSections: (longDraftId: string) => Promise<void>;
  createSection: (longDraftId: string, title?: string, parentId?: string | null) => Promise<Section>;
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (longDraftId: string, sectionIds: string[]) => Promise<void>;
  setCurrentSection: (id: string | null) => void;

  // Actions - Footnotes
  addFootnote: (sectionId: string, footnote: Omit<Footnote, 'id' | 'marker'>) => Promise<void>;
  updateFootnote: (sectionId: string, footnoteId: string, updates: Partial<Footnote>) => Promise<void>;
  deleteFootnote: (sectionId: string, footnoteId: string) => Promise<void>;

  // Actions - UI
  setViewMode: (mode: ViewMode) => void;
  toggleFocusMode: () => void;
  setTOCVisible: (visible: boolean) => void;
  toggleTOC: () => void;

  // Getters
  getCurrentLongDraft: () => LongDraft | null;
  getCurrentSection: () => Section | null;
  getSectionsForDocument: (longDraftId: string) => Section[];
  getRootSections: (longDraftId: string) => Section[];
  getChildSections: (parentId: string, longDraftId: string) => Section[];
  getTotalWordCount: (longDraftId: string) => number;
  getSectionHierarchy: (longDraftId: string) => SectionNode[];

  // Internal helpers
  findSectionById: (id: string) => Section | null;
  updateDocumentMetadata: (longDraftId: string) => Promise<void>;
}

// Helper type for hierarchical section display
export interface SectionNode {
  section: Section;
  children: SectionNode[];
  depth: number;
}

function calculateWordCount(content: string): number {
  // Strip HTML tags if content is HTML
  const text = content.replace(/<[^>]*>/g, ' ');
  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

function buildSectionHierarchy(sections: Section[], parentId: string | null = null, depth: number = 0): SectionNode[] {
  return sections
    .filter(s => s.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(section => ({
      section,
      depth,
      children: buildSectionHierarchy(sections, section.id, depth + 1),
    }));
}

export const useLongDraftsStore = create<LongDraftsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      longDrafts: [],
      currentLongDraftId: null,
      sectionsMap: new Map(),
      currentSectionId: null,
      isLoading: false,
      error: null,
      viewMode: 'normal',
      isTOCVisible: true,

      // Document actions
      loadLongDrafts: async () => {
        set({ isLoading: true, error: null });
        try {
          const longDrafts = await longDraftsQueries.getAllLongDrafts();
          set({ longDrafts, isLoading: false });

          // If no current document and documents exist, select the first one
          const { currentLongDraftId } = get();
          if (!currentLongDraftId && longDrafts.length > 0) {
            set({ currentLongDraftId: longDrafts[0].id });
            // Load sections for the first document
            await get().loadSections(longDrafts[0].id);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load long drafts',
            isLoading: false,
          });
        }
      },

      loadLongDraft: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const longDraft = await longDraftsQueries.getLongDraft(id);
          if (longDraft) {
            set(state => ({
              longDrafts: state.longDrafts.some(d => d.id === id)
                ? state.longDrafts.map(d => d.id === id ? longDraft : d)
                : [...state.longDrafts, longDraft],
              currentLongDraftId: id,
              isLoading: false,
            }));
            await get().loadSections(id);
          } else {
            set({ error: 'Long draft not found', isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load long draft',
            isLoading: false,
          });
        }
      },

      createLongDraft: async (title = 'Untitled Document') => {
        const now = new Date();
        const newLongDraft: LongDraft = {
          id: crypto.randomUUID(),
          title,
          sectionIds: [],
          settings: {
            fonts: ['Crimson Pro', 'Inter', 'Georgia'],
            defaultFont: 'Crimson Pro',
            showTOC: true,
            showWordCount: true,
            focusModeEnabled: false,
            typewriterMode: false,
          },
          metadata: {
            createdAt: now,
            modifiedAt: now,
            totalWordCount: 0,
          },
          createdAt: now,
          modifiedAt: now,
        };

        try {
          await longDraftsQueries.createLongDraft(newLongDraft);
          set(state => ({
            longDrafts: [newLongDraft, ...state.longDrafts],
            currentLongDraftId: newLongDraft.id,
            sectionsMap: new Map(state.sectionsMap).set(newLongDraft.id, []),
          }));
          return newLongDraft;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create long draft',
          });
          throw error;
        }
      },

      updateLongDraft: async (id: string, updates: Partial<LongDraft>) => {
        try {
          await longDraftsQueries.updateLongDraft(id, updates);
          set(state => ({
            longDrafts: state.longDrafts.map(doc =>
              doc.id === id
                ? { ...doc, ...updates, modifiedAt: new Date() }
                : doc
            ),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update long draft',
          });
        }
      },

      deleteLongDraft: async (id: string) => {
        try {
          cancelScheduledDocumentMetadataSync(id);
          await longDraftsQueries.deleteLongDraft(id);
          set(state => {
            const updatedDrafts = state.longDrafts.filter(d => d.id !== id);
            const newSectionsMap = new Map(state.sectionsMap);
            newSectionsMap.delete(id);

            let newCurrentId = state.currentLongDraftId;
            let newCurrentSectionId = state.currentSectionId;

            // If deleted document was current, select another
            if (state.currentLongDraftId === id) {
              newCurrentId = updatedDrafts.length > 0 ? updatedDrafts[0].id : null;
              newCurrentSectionId = null;
            }

            return {
              longDrafts: updatedDrafts,
              currentLongDraftId: newCurrentId,
              currentSectionId: newCurrentSectionId,
              sectionsMap: newSectionsMap,
            };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete long draft',
          });
        }
      },

      setCurrentLongDraft: (id: string | null) => {
        set({ currentLongDraftId: id, currentSectionId: null });
        if (id) {
          get().loadSections(id);
        }
      },

      // Section actions
      loadSections: async (longDraftId: string) => {
        try {
          const sections = await longDraftsQueries.getSectionsByLongDraft(longDraftId);
          set(state => {
            const newMap = new Map(state.sectionsMap);
            newMap.set(longDraftId, sections);
            return { sectionsMap: newMap };
          });

          // Select first section if none selected and sections exist
          const { currentSectionId } = get();
          if (!currentSectionId && sections.length > 0) {
            set({ currentSectionId: sections[0].id });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load sections',
          });
        }
      },

      createSection: async (longDraftId: string, title = 'Untitled Section', parentId = null) => {
        const now = new Date();
        const currentSections = get().sectionsMap.get(longDraftId) || [];

        // Calculate order: place at end of siblings
        const siblings = currentSections.filter(s => s.parentId === parentId);
        const order = siblings.length;

        const newSection: Section = {
          id: crypto.randomUUID(),
          longDraftId,
          title,
          content: '',
          order,
          parentId,
          footnotes: [],
          status: 'draft',
          notes: '',
          wordCount: 0,
          isLocked: false,
          createdAt: now,
          modifiedAt: now,
        };

        try {
          await longDraftsQueries.createSection(newSection);
          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(longDraftId) || [];
            newMap.set(longDraftId, [...sections, newSection]);
            return {
              sectionsMap: newMap,
              currentSectionId: newSection.id,
            };
          });

          // Update total word count
          await get().updateDocumentMetadata(longDraftId);

          return newSection;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create section',
          });
          throw error;
        }
      },

      updateSection: async (id: string, updates: Partial<Section>) => {
        try {
          // Calculate word count if content is updated
          const finalUpdates = { ...updates };
          if (updates.content !== undefined) {
            finalUpdates.wordCount = calculateWordCount(updates.content);
          }

          await longDraftsQueries.updateSection(id, finalUpdates);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            for (const [docId, sections] of newMap.entries()) {
              const sectionIndex = sections.findIndex(s => s.id === id);
              if (sectionIndex !== -1) {
                const updatedSections = [...sections];
                updatedSections[sectionIndex] = {
                  ...sections[sectionIndex],
                  ...finalUpdates,
                  modifiedAt: new Date(),
                };
                newMap.set(docId, updatedSections);
                break;
              }
            }
            return { sectionsMap: newMap };
          });

          // Coalesce metadata writes to reduce autosave write amplification.
          const section = get().findSectionById(id);
          if (section) {
            scheduleDocumentMetadataSync(section.longDraftId, get);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update section',
          });
        }
      },

      deleteSection: async (id: string) => {
        const section = get().findSectionById(id);
        if (!section) return;

        try {
          await longDraftsQueries.deleteSection(id);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(section.longDraftId) || [];

            // Remove section and all children recursively
            const idsToRemove = new Set<string>();
            const collectIds = (parentId: string) => {
              idsToRemove.add(parentId);
              sections.filter(s => s.parentId === parentId).forEach(s => collectIds(s.id));
            };
            collectIds(id);

            const filteredSections = sections.filter(s => !idsToRemove.has(s.id));
            newMap.set(section.longDraftId, filteredSections);

            let newCurrentSectionId = state.currentSectionId;
            if (idsToRemove.has(state.currentSectionId || '')) {
              newCurrentSectionId = filteredSections.length > 0 ? filteredSections[0].id : null;
            }

            return {
              sectionsMap: newMap,
              currentSectionId: newCurrentSectionId,
            };
          });

          await get().updateDocumentMetadata(section.longDraftId);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete section',
          });
        }
      },

      reorderSections: async (longDraftId: string, sectionIds: string[]) => {
        try {
          await longDraftsQueries.reorderSections(longDraftId, sectionIds);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(longDraftId) || [];

            // Update order based on new positions
            const reorderedSections = sections.map(section => {
              const newOrder = sectionIds.indexOf(section.id);
              return newOrder !== -1 ? { ...section, order: newOrder } : section;
            }).sort((a, b) => a.order - b.order);

            newMap.set(longDraftId, reorderedSections);
            return { sectionsMap: newMap };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reorder sections',
          });
        }
      },

      setCurrentSection: (id: string | null) => {
        set({ currentSectionId: id });
      },

      // Footnote actions
      addFootnote: async (sectionId: string, footnoteData: Omit<Footnote, 'id' | 'marker'>) => {
        const section = get().findSectionById(sectionId);
        if (!section) return;

        const newFootnote: Footnote = {
          id: crypto.randomUUID(),
          marker: section.footnotes.length + 1,
          ...footnoteData,
        };

        const updatedFootnotes = [...section.footnotes, newFootnote];
        await get().updateSection(sectionId, { footnotes: updatedFootnotes });
      },

      updateFootnote: async (sectionId: string, footnoteId: string, updates: Partial<Footnote>) => {
        const section = get().findSectionById(sectionId);
        if (!section) return;

        const updatedFootnotes = section.footnotes.map((fn: Footnote) =>
          fn.id === footnoteId ? { ...fn, ...updates } : fn
        );
        await get().updateSection(sectionId, { footnotes: updatedFootnotes });
      },

      deleteFootnote: async (sectionId: string, footnoteId: string) => {
        const section = get().findSectionById(sectionId);
        if (!section) return;

        // Remove footnote and renumber remaining ones
        const filteredFootnotes = section.footnotes
          .filter((fn: Footnote) => fn.id !== footnoteId)
          .map((fn: Footnote, index: number) => ({ ...fn, marker: index + 1 }));

        await get().updateSection(sectionId, { footnotes: filteredFootnotes });
      },

      // UI actions
      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      toggleFocusMode: () => {
        set(state => ({ viewMode: state.viewMode === 'focus' ? 'normal' : 'focus' }));
      },

      setTOCVisible: (visible: boolean) => {
        set({ isTOCVisible: visible });
      },

      toggleTOC: () => {
        set(state => ({ isTOCVisible: !state.isTOCVisible }));
      },

      // Getters
      getCurrentLongDraft: () => {
        const { longDrafts, currentLongDraftId } = get();
        if (!currentLongDraftId) return null;
        return longDrafts.find(d => d.id === currentLongDraftId) || null;
      },

      getCurrentSection: () => {
        const { currentSectionId, currentLongDraftId, sectionsMap } = get();
        if (!currentSectionId || !currentLongDraftId) return null;
        const sections = sectionsMap.get(currentLongDraftId) || [];
        return sections.find(s => s.id === currentSectionId) || null;
      },

      getSectionsForDocument: (longDraftId: string) => {
        return get().sectionsMap.get(longDraftId) || [];
      },

      getRootSections: (longDraftId: string) => {
        const sections = get().sectionsMap.get(longDraftId) || [];
        return sections
          .filter(s => s.parentId === null)
          .sort((a, b) => a.order - b.order);
      },

      getChildSections: (parentId: string, longDraftId: string) => {
        const sections = get().sectionsMap.get(longDraftId) || [];
        return sections
          .filter(s => s.parentId === parentId)
          .sort((a, b) => a.order - b.order);
      },

      getTotalWordCount: (longDraftId: string) => {
        const sections = get().sectionsMap.get(longDraftId) || [];
        return sections.reduce((total, section) => total + section.wordCount, 0);
      },

      getSectionHierarchy: (longDraftId: string) => {
        const sections = get().sectionsMap.get(longDraftId) || [];
        return buildSectionHierarchy(sections);
      },

      // Internal helpers (not exposed in interface but used internally)
      findSectionById: (id: string): Section | null => {
        for (const sections of get().sectionsMap.values()) {
          const section = sections.find(s => s.id === id);
          if (section) return section;
        }
        return null;
      },

      updateDocumentMetadata: async (longDraftId: string) => {
        cancelScheduledDocumentMetadataSync(longDraftId);
        const totalWordCount = get().getTotalWordCount(longDraftId);
        const currentSection = get().getCurrentSection();
        const currentDoc = get().getCurrentLongDraft();

        await get().updateLongDraft(longDraftId, {
          metadata: {
            createdAt: currentDoc?.metadata?.createdAt ?? currentDoc?.createdAt ?? new Date(),
            modifiedAt: new Date(),
            totalWordCount,
            lastEditedSection: currentSection?.id,
          },
        });
      },
    }),
    { name: 'long-drafts-store' }
  )
);

// Selectors for proper reactivity
export const selectLongDrafts = (state: LongDraftsState) => state.longDrafts;
export const selectCurrentLongDraftId = (state: LongDraftsState) => state.currentLongDraftId;
export const selectSectionsMap = (state: LongDraftsState) => state.sectionsMap;
export const selectCurrentSectionId = (state: LongDraftsState) => state.currentSectionId;
export const selectLongDraftsIsLoading = (state: LongDraftsState) => state.isLoading;
export const selectLongDraftsError = (state: LongDraftsState) => state.error;
export const selectViewMode = (state: LongDraftsState) => state.viewMode;
export const selectIsTOCVisible = (state: LongDraftsState) => state.isTOCVisible;
export const selectLongDraftsCount = (state: LongDraftsState) => state.longDrafts.length;

// Derived selectors
export const selectCurrentLongDraft = (state: LongDraftsState) => {
  if (!state.currentLongDraftId) return null;
  return state.longDrafts.find(d => d.id === state.currentLongDraftId) ?? null;
};

export const selectCurrentSections = (state: LongDraftsState) => {
  if (!state.currentLongDraftId) return [];
  return state.sectionsMap.get(state.currentLongDraftId) ?? [];
};

export const selectCurrentSection = (state: LongDraftsState) => {
  if (!state.currentSectionId || !state.currentLongDraftId) return null;
  const sections = state.sectionsMap.get(state.currentLongDraftId) ?? [];
  return sections.find(s => s.id === state.currentSectionId) ?? null;
};

export const selectCurrentDocumentWordCount = (state: LongDraftsState) => {
  if (!state.currentLongDraftId) return 0;
  const sections = state.sectionsMap.get(state.currentLongDraftId) ?? [];
  return sections.reduce((total, s) => total + s.wordCount, 0);
};

export const selectIsFocusMode = (state: LongDraftsState) => state.viewMode === 'focus';
