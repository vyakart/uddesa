import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AcademicPaper,
  AcademicSection,
  Author,
  BibliographyEntry,
  Citation,
  CitationStyle,
  PaperCreationOptions,
} from '@/types/academic';
import * as academicQueries from '@/db/queries/academic';

const SECTION_METADATA_SYNC_DEBOUNCE_MS = 300;
const pendingPaperMetadataSyncs = new Map<string, ReturnType<typeof setTimeout>>();

function cancelScheduledPaperMetadataSync(paperId: string): void {
  const timer = pendingPaperMetadataSyncs.get(paperId);
  if (!timer) return;
  clearTimeout(timer);
  pendingPaperMetadataSyncs.delete(paperId);
}

function schedulePaperMetadataSync(paperId: string, get: () => AcademicState): void {
  cancelScheduledPaperMetadataSync(paperId);
  const timer = setTimeout(() => {
    pendingPaperMetadataSyncs.delete(paperId);
    void get().updatePaperMetadata(paperId);
  }, SECTION_METADATA_SYNC_DEBOUNCE_MS);
  pendingPaperMetadataSyncs.set(paperId, timer);
}

export function __resetAcademicMetadataSyncSchedulerForTests(): void {
  for (const timer of pendingPaperMetadataSyncs.values()) {
    clearTimeout(timer);
  }
  pendingPaperMetadataSyncs.clear();
}

export type AcademicViewMode = 'normal' | 'focus';
export type AcademicSectionStatus = 'draft' | 'in-progress' | 'review' | 'complete';

interface AcademicState {
  // Papers state
  papers: AcademicPaper[];
  currentPaperId: string | null;

  // Sections state (keyed by paperId)
  sectionsMap: Map<string, AcademicSection[]>;
  currentSectionId: string | null;

  // Bibliography entries (global library)
  bibliographyEntries: BibliographyEntry[];

  // Citations (keyed by paperId)
  citationsMap: Map<string, Citation[]>;

  // UI state
  isLoading: boolean;
  error: string | null;
  viewMode: AcademicViewMode;
  isTOCVisible: boolean;
  isBibliographyPanelVisible: boolean;
  citationStyle: CitationStyle;

  // Actions - Papers
  loadPapers: () => Promise<void>;
  loadPaper: (id: string) => Promise<void>;
  createPaper: (title?: string, template?: string, options?: PaperCreationOptions) => Promise<AcademicPaper>;
  updatePaper: (id: string, updates: Partial<AcademicPaper>) => Promise<void>;
  deletePaper: (id: string) => Promise<void>;
  setCurrentPaper: (id: string | null) => void;

  // Actions - Sections
  loadSections: (paperId: string) => Promise<void>;
  createSection: (paperId: string, title?: string, parentId?: string | null) => Promise<AcademicSection>;
  updateSection: (id: string, updates: Partial<AcademicSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (paperId: string, sectionIds: string[]) => Promise<void>;
  setCurrentSection: (id: string | null) => void;

  // Actions - Bibliography
  loadBibliographyEntries: () => Promise<void>;
  addBibliographyEntry: (entry: Omit<BibliographyEntry, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<BibliographyEntry>;
  updateBibliographyEntry: (id: string, updates: Partial<BibliographyEntry>) => Promise<void>;
  deleteBibliographyEntry: (id: string) => Promise<void>;
  searchBibliographyEntries: (query: string) => Promise<BibliographyEntry[]>;

  // Actions - Citations
  loadCitations: (paperId: string) => Promise<void>;
  addCitation: (paperId: string, bibliographyEntryId: string, pageNumbers?: string) => Promise<Citation>;
  updateCitation: (id: string, updates: Partial<Citation>) => Promise<void>;
  deleteCitation: (id: string) => Promise<void>;

  // Actions - UI
  setViewMode: (mode: AcademicViewMode) => void;
  toggleFocusMode: () => void;
  setTOCVisible: (visible: boolean) => void;
  toggleTOC: () => void;
  setBibliographyPanelVisible: (visible: boolean) => void;
  toggleBibliographyPanel: () => void;
  setCitationStyle: (style: CitationStyle) => void;

  // Getters
  getCurrentPaper: () => AcademicPaper | null;
  getCurrentSection: () => AcademicSection | null;
  getSectionsForPaper: (paperId: string) => AcademicSection[];
  getRootSections: (paperId: string) => AcademicSection[];
  getChildSections: (parentId: string, paperId: string) => AcademicSection[];
  getTotalWordCount: (paperId: string) => number;
  getSectionHierarchy: (paperId: string) => AcademicSectionNode[];
  getCitationsForPaper: (paperId: string) => Citation[];
  getBibliographyForPaper: (paperId: string) => BibliographyEntry[];

  // Internal helpers
  findSectionById: (id: string) => AcademicSection | null;
  updatePaperMetadata: (paperId: string) => Promise<void>;
}

// Helper type for hierarchical section display
export interface AcademicSectionNode {
  section: AcademicSection;
  children: AcademicSectionNode[];
  depth: number;
}

// IMRAD template sections
const IMRAD_SECTIONS = [
  'Introduction',
  'Methods',
  'Results',
  'Discussion',
  'Conclusion',
];

function sanitizeAuthors(authors: Author[] | undefined): Author[] {
  if (!authors || authors.length === 0) return [];
  return authors
    .map((author) => ({
      firstName: author.firstName.trim(),
      lastName: author.lastName.trim(),
      affiliation: author.affiliation?.trim(),
    }))
    .filter((author) => author.firstName || author.lastName)
    .map((author) => ({
      ...author,
      affiliation: author.affiliation || undefined,
    }));
}

function sanitizeKeywords(keywords: string[] | undefined): string[] {
  if (!keywords || keywords.length === 0) return [];
  return keywords.map((keyword) => keyword.trim()).filter(Boolean);
}

function sanitizeSections(customSections: string[] | undefined): string[] {
  if (!customSections || customSections.length === 0) return [];
  return customSections.map((section) => section.trim()).filter(Boolean);
}

function calculateWordCount(content: string): number {
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

function buildSectionHierarchy(sections: AcademicSection[], parentId: string | null = null, depth: number = 0): AcademicSectionNode[] {
  return sections
    .filter(s => s.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(section => ({
      section,
      depth,
      children: buildSectionHierarchy(sections, section.id, depth + 1),
    }));
}

export const useAcademicStore = create<AcademicState>()(
  devtools(
    (set, get) => ({
      // Initial state
      papers: [],
      currentPaperId: null,
      sectionsMap: new Map(),
      currentSectionId: null,
      bibliographyEntries: [],
      citationsMap: new Map(),
      isLoading: false,
      error: null,
      viewMode: 'normal',
      isTOCVisible: true,
      isBibliographyPanelVisible: false,
      citationStyle: 'apa7',

      // Paper actions
      loadPapers: async () => {
        set({ isLoading: true, error: null });
        try {
          const papers = await academicQueries.getAllPapers();
          set({ papers, isLoading: false });

          const { currentPaperId } = get();
          if (!currentPaperId && papers.length > 0) {
            set({ currentPaperId: papers[0].id });
            await get().loadSections(papers[0].id);
            await get().loadCitations(papers[0].id);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load papers',
            isLoading: false,
          });
        }
      },

      loadPaper: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const paper = await academicQueries.getPaper(id);
          if (paper) {
            set(state => ({
              papers: state.papers.some(p => p.id === id)
                ? state.papers.map(p => p.id === id ? paper : p)
                : [...state.papers, paper],
              currentPaperId: id,
              isLoading: false,
            }));
            await get().loadSections(id);
            await get().loadCitations(id);
          } else {
            set({ error: 'Paper not found', isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load paper',
            isLoading: false,
          });
        }
      },

      createPaper: async (title = 'Untitled Paper', template?: string, options?: PaperCreationOptions) => {
        const now = new Date();
        const customSections = sanitizeSections(options?.customSections);
        const newPaper: AcademicPaper = {
          id: crypto.randomUUID(),
          title,
          authors: sanitizeAuthors(options?.authors),
          abstract: options?.abstract?.trim() || '',
          keywords: sanitizeKeywords(options?.keywords),
          sectionIds: [],
          citationIds: [],
          bibliographyEntryIds: [],
          figureIds: [],
          tableIds: [],
          settings: {
            citationStyle: get().citationStyle,
            pageSize: 'a4',
            margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
            lineSpacing: 2,
            fontFamily: 'Times New Roman',
            fontSize: 12,
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
          await academicQueries.createPaper(newPaper);
          set(state => ({
            papers: [newPaper, ...state.papers],
            currentPaperId: newPaper.id,
            sectionsMap: new Map(state.sectionsMap).set(newPaper.id, []),
            citationsMap: new Map(state.citationsMap).set(newPaper.id, []),
          }));

          // Create template sections if specified
          if (template === 'imrad') {
            for (let i = 0; i < IMRAD_SECTIONS.length; i++) {
              await get().createSection(newPaper.id, IMRAD_SECTIONS[i]);
            }
          }
          if (template === 'custom') {
            for (let i = 0; i < customSections.length; i++) {
              await get().createSection(newPaper.id, customSections[i]);
            }
          }

          return newPaper;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create paper',
          });
          throw error;
        }
      },

      updatePaper: async (id: string, updates: Partial<AcademicPaper>) => {
        try {
          await academicQueries.updatePaper(id, updates);
          set(state => ({
            papers: state.papers.map(paper =>
              paper.id === id
                ? { ...paper, ...updates, modifiedAt: new Date() }
                : paper
            ),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update paper',
          });
        }
      },

      deletePaper: async (id: string) => {
        try {
          cancelScheduledPaperMetadataSync(id);
          await academicQueries.deletePaper(id);
          set(state => {
            const updatedPapers = state.papers.filter(p => p.id !== id);
            const newSectionsMap = new Map(state.sectionsMap);
            const newCitationsMap = new Map(state.citationsMap);
            newSectionsMap.delete(id);
            newCitationsMap.delete(id);

            let newCurrentId = state.currentPaperId;
            let newCurrentSectionId = state.currentSectionId;

            if (state.currentPaperId === id) {
              newCurrentId = updatedPapers.length > 0 ? updatedPapers[0].id : null;
              newCurrentSectionId = null;
            }

            return {
              papers: updatedPapers,
              currentPaperId: newCurrentId,
              currentSectionId: newCurrentSectionId,
              sectionsMap: newSectionsMap,
              citationsMap: newCitationsMap,
            };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete paper',
          });
        }
      },

      setCurrentPaper: (id: string | null) => {
        set({ currentPaperId: id, currentSectionId: null });
        if (id) {
          get().loadSections(id);
          get().loadCitations(id);
        }
      },

      // Section actions
      loadSections: async (paperId: string) => {
        try {
          const sections = await academicQueries.getSectionsByPaper(paperId);
          set(state => {
            const newMap = new Map(state.sectionsMap);
            newMap.set(paperId, sections);
            return { sectionsMap: newMap };
          });

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

      createSection: async (paperId: string, title = 'Untitled Section', parentId = null) => {
        const currentSections = get().sectionsMap.get(paperId) || [];
        const siblings = currentSections.filter(s => s.parentId === parentId);
        const order = siblings.length;

        const newSection: AcademicSection = {
          id: crypto.randomUUID(),
          paperId,
          title,
          content: '',
          order,
          parentId,
          wordCount: 0,
        };

        try {
          await academicQueries.createAcademicSection(newSection);
          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(paperId) || [];
            newMap.set(paperId, [...sections, newSection]);
            return {
              sectionsMap: newMap,
              currentSectionId: newSection.id,
            };
          });

          await get().updatePaperMetadata(paperId);
          return newSection;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create section',
          });
          throw error;
        }
      },

      updateSection: async (id: string, updates: Partial<AcademicSection>) => {
        try {
          const finalUpdates = { ...updates };
          if (updates.content !== undefined) {
            finalUpdates.wordCount = calculateWordCount(updates.content);
          }

          await academicQueries.updateAcademicSection(id, finalUpdates);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            for (const [paperId, sections] of newMap.entries()) {
              const sectionIndex = sections.findIndex(s => s.id === id);
              if (sectionIndex !== -1) {
                const updatedSections = [...sections];
                updatedSections[sectionIndex] = {
                  ...sections[sectionIndex],
                  ...finalUpdates,
                };
                newMap.set(paperId, updatedSections);
                break;
              }
            }
            return { sectionsMap: newMap };
          });

          const section = get().findSectionById(id);
          if (section) {
            schedulePaperMetadataSync(section.paperId, get);
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
          await academicQueries.deleteAcademicSection(id);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(section.paperId) || [];

            const idsToRemove = new Set<string>();
            const collectIds = (parentId: string) => {
              idsToRemove.add(parentId);
              sections.filter(s => s.parentId === parentId).forEach(s => collectIds(s.id));
            };
            collectIds(id);

            const filteredSections = sections.filter(s => !idsToRemove.has(s.id));
            newMap.set(section.paperId, filteredSections);

            let newCurrentSectionId = state.currentSectionId;
            if (idsToRemove.has(state.currentSectionId || '')) {
              newCurrentSectionId = filteredSections.length > 0 ? filteredSections[0].id : null;
            }

            return {
              sectionsMap: newMap,
              currentSectionId: newCurrentSectionId,
            };
          });

          await get().updatePaperMetadata(section.paperId);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete section',
          });
        }
      },

      reorderSections: async (paperId: string, sectionIds: string[]) => {
        try {
          await academicQueries.reorderAcademicSections(paperId, sectionIds);

          set(state => {
            const newMap = new Map(state.sectionsMap);
            const sections = newMap.get(paperId) || [];

            const reorderedSections = sections.map(section => {
              const newOrder = sectionIds.indexOf(section.id);
              return newOrder !== -1 ? { ...section, order: newOrder } : section;
            }).sort((a, b) => a.order - b.order);

            newMap.set(paperId, reorderedSections);
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

      // Bibliography actions
      loadBibliographyEntries: async () => {
        try {
          const entries = await academicQueries.getAllBibliographyEntries();
          set({ bibliographyEntries: entries });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load bibliography entries',
          });
        }
      },

      addBibliographyEntry: async (entryData) => {
        const now = new Date();
        const newEntry: BibliographyEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: now,
          modifiedAt: now,
        };

        try {
          await academicQueries.createBibliographyEntry(newEntry);
          set(state => ({
            bibliographyEntries: [...state.bibliographyEntries, newEntry],
          }));
          return newEntry;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add bibliography entry',
          });
          throw error;
        }
      },

      updateBibliographyEntry: async (id: string, updates: Partial<BibliographyEntry>) => {
        try {
          await academicQueries.updateBibliographyEntry(id, updates);
          set(state => ({
            bibliographyEntries: state.bibliographyEntries.map(entry =>
              entry.id === id ? { ...entry, ...updates, modifiedAt: new Date() } : entry
            ),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update bibliography entry',
          });
        }
      },

      deleteBibliographyEntry: async (id: string) => {
        try {
          await academicQueries.deleteBibliographyEntry(id);
          set(state => ({
            bibliographyEntries: state.bibliographyEntries.filter(entry => entry.id !== id),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete bibliography entry',
          });
        }
      },

      searchBibliographyEntries: async (query: string) => {
        try {
          return await academicQueries.searchBibliographyEntries(query);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search bibliography entries',
          });
          return [];
        }
      },

      // Citation actions
      loadCitations: async (paperId: string) => {
        try {
          const citations = await academicQueries.getCitationsByPaper(paperId);
          set(state => {
            const newMap = new Map(state.citationsMap);
            newMap.set(paperId, citations);
            return { citationsMap: newMap };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load citations',
          });
        }
      },

      addCitation: async (paperId: string, bibliographyEntryId: string, pageNumbers?: string) => {
        const entry = get().bibliographyEntries.find(e => e.id === bibliographyEntryId);
        if (!entry) throw new Error('Bibliography entry not found');

        const existingCitations = get().citationsMap.get(paperId) || [];

        const newCitation: Citation = {
          id: crypto.randomUUID(),
          paperId,
          bibliographyEntryId,
          inTextFormat: '', // Will be formatted by the component
          pageNumbers,
          positionInDocument: existingCitations.length,
        };

        try {
          await academicQueries.createCitation(newCitation);
          set(state => {
            const newMap = new Map(state.citationsMap);
            const citations = newMap.get(paperId) || [];
            newMap.set(paperId, [...citations, newCitation]);
            return { citationsMap: newMap };
          });

          // Add bibliography entry to paper if not already linked
          const paper = get().papers.find(p => p.id === paperId);
          if (paper && !paper.bibliographyEntryIds.includes(bibliographyEntryId)) {
            await get().updatePaper(paperId, {
              bibliographyEntryIds: [...paper.bibliographyEntryIds, bibliographyEntryId],
            });
          }

          return newCitation;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add citation',
          });
          throw error;
        }
      },

      updateCitation: async (id: string, updates: Partial<Citation>) => {
        try {
          await academicQueries.updateCitation(id, updates);
          set(state => {
            const newMap = new Map(state.citationsMap);
            for (const [paperId, citations] of newMap.entries()) {
              const citationIndex = citations.findIndex(c => c.id === id);
              if (citationIndex !== -1) {
                const updatedCitations = [...citations];
                updatedCitations[citationIndex] = {
                  ...citations[citationIndex],
                  ...updates,
                };
                newMap.set(paperId, updatedCitations);
                break;
              }
            }
            return { citationsMap: newMap };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update citation',
          });
        }
      },

      deleteCitation: async (id: string) => {
        try {
          await academicQueries.deleteCitation(id);
          set(state => {
            const newMap = new Map(state.citationsMap);
            for (const [paperId, citations] of newMap.entries()) {
              const filtered = citations.filter(c => c.id !== id);
              if (filtered.length !== citations.length) {
                newMap.set(paperId, filtered);
                break;
              }
            }
            return { citationsMap: newMap };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete citation',
          });
        }
      },

      // UI actions
      setViewMode: (mode: AcademicViewMode) => {
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

      setBibliographyPanelVisible: (visible: boolean) => {
        set({ isBibliographyPanelVisible: visible });
      },

      toggleBibliographyPanel: () => {
        set(state => ({ isBibliographyPanelVisible: !state.isBibliographyPanelVisible }));
      },

      setCitationStyle: (style: CitationStyle) => {
        set({ citationStyle: style });
        // Also update current paper's settings
        const { currentPaperId } = get();
        if (currentPaperId) {
          const paper = get().papers.find(p => p.id === currentPaperId);
          if (paper) {
            get().updatePaper(currentPaperId, {
              settings: { ...paper.settings, citationStyle: style },
            });
          }
        }
      },

      // Getters
      getCurrentPaper: () => {
        const { papers, currentPaperId } = get();
        if (!currentPaperId) return null;
        return papers.find(p => p.id === currentPaperId) || null;
      },

      getCurrentSection: () => {
        const { currentSectionId, currentPaperId, sectionsMap } = get();
        if (!currentSectionId || !currentPaperId) return null;
        const sections = sectionsMap.get(currentPaperId) || [];
        return sections.find(s => s.id === currentSectionId) || null;
      },

      getSectionsForPaper: (paperId: string) => {
        return get().sectionsMap.get(paperId) || [];
      },

      getRootSections: (paperId: string) => {
        const sections = get().sectionsMap.get(paperId) || [];
        return sections
          .filter(s => s.parentId === null)
          .sort((a, b) => a.order - b.order);
      },

      getChildSections: (parentId: string, paperId: string) => {
        const sections = get().sectionsMap.get(paperId) || [];
        return sections
          .filter(s => s.parentId === parentId)
          .sort((a, b) => a.order - b.order);
      },

      getTotalWordCount: (paperId: string) => {
        const sections = get().sectionsMap.get(paperId) || [];
        return sections.reduce((total, section) => total + section.wordCount, 0);
      },

      getSectionHierarchy: (paperId: string) => {
        const sections = get().sectionsMap.get(paperId) || [];
        return buildSectionHierarchy(sections);
      },

      getCitationsForPaper: (paperId: string) => {
        return get().citationsMap.get(paperId) || [];
      },

      getBibliographyForPaper: (paperId: string) => {
        const paper = get().papers.find(p => p.id === paperId);
        if (!paper) return [];
        return get().bibliographyEntries.filter(entry =>
          paper.bibliographyEntryIds.includes(entry.id)
        );
      },

      // Internal helpers
      findSectionById: (id: string): AcademicSection | null => {
        for (const sections of get().sectionsMap.values()) {
          const section = sections.find(s => s.id === id);
          if (section) return section;
        }
        return null;
      },

      updatePaperMetadata: async (paperId: string) => {
        cancelScheduledPaperMetadataSync(paperId);
        const totalWordCount = get().getTotalWordCount(paperId);
        const currentPaper = get().getCurrentPaper();

        await get().updatePaper(paperId, {
          metadata: {
            createdAt: currentPaper?.metadata?.createdAt ?? currentPaper?.createdAt ?? new Date(),
            modifiedAt: new Date(),
            totalWordCount,
          },
        });
      },
    }),
    { name: 'academic-store' }
  )
);

// Stable empty arrays to avoid infinite re-renders
const EMPTY_SECTIONS: AcademicSection[] = [];
const EMPTY_CITATIONS: Citation[] = [];
const EMPTY_BIBLIOGRAPHY: BibliographyEntry[] = [];

// Selectors for proper reactivity
export const selectPapers = (state: AcademicState) => state.papers;
export const selectCurrentPaperId = (state: AcademicState) => state.currentPaperId;
export const selectAcademicSectionsMap = (state: AcademicState) => state.sectionsMap;
export const selectAcademicCurrentSectionId = (state: AcademicState) => state.currentSectionId;
export const selectBibliographyEntries = (state: AcademicState) => state.bibliographyEntries;
export const selectCitationsMap = (state: AcademicState) => state.citationsMap;
export const selectAcademicIsLoading = (state: AcademicState) => state.isLoading;
export const selectAcademicError = (state: AcademicState) => state.error;
export const selectAcademicViewMode = (state: AcademicState) => state.viewMode;
export const selectAcademicIsTOCVisible = (state: AcademicState) => state.isTOCVisible;
export const selectIsBibliographyPanelVisible = (state: AcademicState) => state.isBibliographyPanelVisible;
export const selectCitationStyle = (state: AcademicState) => state.citationStyle;
export const selectPapersCount = (state: AcademicState) => state.papers.length;

// Derived selectors
export const selectCurrentPaper = (state: AcademicState) => {
  if (!state.currentPaperId) return null;
  return state.papers.find(p => p.id === state.currentPaperId) ?? null;
};

export const selectAcademicCurrentSections = (state: AcademicState) => {
  if (!state.currentPaperId) return EMPTY_SECTIONS;
  return state.sectionsMap.get(state.currentPaperId) ?? EMPTY_SECTIONS;
};

export const selectAcademicCurrentSection = (state: AcademicState) => {
  if (!state.currentSectionId || !state.currentPaperId) return null;
  const sections = state.sectionsMap.get(state.currentPaperId);
  if (!sections) return null;
  return sections.find(s => s.id === state.currentSectionId) ?? null;
};

export const selectCurrentPaperWordCount = (state: AcademicState) => {
  if (!state.currentPaperId) return 0;
  const sections = state.sectionsMap.get(state.currentPaperId);
  if (!sections) return 0;
  return sections.reduce((total, s) => total + s.wordCount, 0);
};

export const selectAcademicIsFocusMode = (state: AcademicState) => state.viewMode === 'focus';

export const selectCurrentPaperCitations = (state: AcademicState) => {
  if (!state.currentPaperId) return EMPTY_CITATIONS;
  return state.citationsMap.get(state.currentPaperId) ?? EMPTY_CITATIONS;
};

export const selectCurrentPaperBibliography = (state: AcademicState) => {
  if (!state.currentPaperId) return EMPTY_BIBLIOGRAPHY;
  const paper = state.papers.find(p => p.id === state.currentPaperId);
  if (!paper) return EMPTY_BIBLIOGRAPHY;
  return state.bibliographyEntries.filter(entry =>
    paper.bibliographyEntryIds.includes(entry.id)
  );
};
