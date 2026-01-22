import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Draft, DraftStatus } from '@/types/drafts';
import * as draftsQueries from '@/db/queries/drafts';

export type DraftSortBy = 'modifiedAt' | 'createdAt' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

interface DraftsState {
  drafts: Draft[];
  currentDraftId: string | null;
  isLoading: boolean;
  error: string | null;
  sortBy: DraftSortBy;
  sortOrder: SortOrder;
  filterStatus: DraftStatus | 'all';

  // Actions
  loadDrafts: () => Promise<void>;
  createDraft: (title?: string) => Promise<Draft>;
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  setCurrentDraft: (id: string | null) => void;

  // Status management
  updateDraftStatus: (id: string, status: DraftStatus) => Promise<void>;
  cycleDraftStatus: (id: string) => Promise<void>;

  // Sorting and filtering
  setSortBy: (sortBy: DraftSortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilterStatus: (status: DraftStatus | 'all') => void;

  // Getters
  getCurrentDraft: () => Draft | null;
  getSortedFilteredDrafts: () => Draft[];
}

function sortDrafts(drafts: Draft[], sortBy: DraftSortBy, sortOrder: SortOrder): Draft[] {
  const sorted = [...drafts].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        const statusOrder = { 'in-progress': 0, 'review': 1, 'complete': 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'modifiedAt':
      default:
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  return sorted;
}

function calculateWordCount(content: string): number {
  // Strip HTML tags if content is HTML
  const text = content.replace(/<[^>]*>/g, ' ');
  // Count words (split by whitespace)
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

const STATUS_CYCLE: DraftStatus[] = ['in-progress', 'review', 'complete'];

export const useDraftsStore = create<DraftsState>()(
  devtools(
    (set, get) => ({
      drafts: [],
      currentDraftId: null,
      isLoading: false,
      error: null,
      sortBy: 'modifiedAt',
      sortOrder: 'desc',
      filterStatus: 'all',

      loadDrafts: async () => {
        set({ isLoading: true, error: null });
        try {
          const drafts = await draftsQueries.getAllDrafts();
          set({ drafts, isLoading: false });

          // If no current draft and drafts exist, select the first one
          const { currentDraftId } = get();
          if (!currentDraftId && drafts.length > 0) {
            set({ currentDraftId: drafts[0].id });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load drafts',
            isLoading: false,
          });
        }
      },

      createDraft: async (title = 'Untitled Draft') => {
        const now = new Date();
        const newDraft: Draft = {
          id: crypto.randomUUID(),
          title,
          content: '',
          status: 'in-progress',
          wordCount: 0,
          tags: [],
          isLocked: false,
          createdAt: now,
          modifiedAt: now,
        };

        try {
          await draftsQueries.createDraft(newDraft);
          set(state => ({
            drafts: [newDraft, ...state.drafts],
            currentDraftId: newDraft.id,
          }));
          return newDraft;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create draft',
          });
          throw error;
        }
      },

      updateDraft: async (id: string, updates: Partial<Draft>) => {
        try {
          // Calculate word count if content is updated
          const finalUpdates = { ...updates };
          if (updates.content !== undefined) {
            finalUpdates.wordCount = calculateWordCount(updates.content);
          }

          await draftsQueries.updateDraft(id, finalUpdates);

          set(state => ({
            drafts: state.drafts.map(draft =>
              draft.id === id
                ? { ...draft, ...finalUpdates, modifiedAt: new Date() }
                : draft
            ),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update draft',
          });
        }
      },

      deleteDraft: async (id: string) => {
        try {
          await draftsQueries.deleteDraft(id);

          set(state => {
            const updatedDrafts = state.drafts.filter(d => d.id !== id);
            let newCurrentDraftId = state.currentDraftId;

            // If deleted draft was current, select another
            if (state.currentDraftId === id) {
              newCurrentDraftId = updatedDrafts.length > 0 ? updatedDrafts[0].id : null;
            }

            return {
              drafts: updatedDrafts,
              currentDraftId: newCurrentDraftId,
            };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete draft',
          });
        }
      },

      setCurrentDraft: (id: string | null) => {
        set({ currentDraftId: id });
      },

      updateDraftStatus: async (id: string, status: DraftStatus) => {
        await get().updateDraft(id, { status });
      },

      cycleDraftStatus: async (id: string) => {
        const draft = get().drafts.find(d => d.id === id);
        if (!draft) return;

        const currentIndex = STATUS_CYCLE.indexOf(draft.status);
        const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
        const nextStatus = STATUS_CYCLE[nextIndex];

        await get().updateDraftStatus(id, nextStatus);
      },

      setSortBy: (sortBy: DraftSortBy) => {
        set({ sortBy });
      },

      setSortOrder: (order: SortOrder) => {
        set({ sortOrder: order });
      },

      setFilterStatus: (status: DraftStatus | 'all') => {
        set({ filterStatus: status });
      },

      getCurrentDraft: () => {
        const { drafts, currentDraftId } = get();
        if (!currentDraftId) return null;
        return drafts.find(d => d.id === currentDraftId) || null;
      },

      getSortedFilteredDrafts: () => {
        const { drafts, sortBy, sortOrder, filterStatus } = get();

        // Filter
        let filtered = drafts;
        if (filterStatus !== 'all') {
          filtered = drafts.filter(d => d.status === filterStatus);
        }

        // Sort
        return sortDrafts(filtered, sortBy, sortOrder);
      },
    }),
    { name: 'drafts-store' }
  )
);

// Selectors
export const selectDrafts = (state: DraftsState) => state.drafts;
export const selectCurrentDraftId = (state: DraftsState) => state.currentDraftId;
export const selectDraftsIsLoading = (state: DraftsState) => state.isLoading;
export const selectDraftsError = (state: DraftsState) => state.error;
export const selectDraftsSortBy = (state: DraftsState) => state.sortBy;
export const selectDraftsSortOrder = (state: DraftsState) => state.sortOrder;
export const selectDraftsFilterStatus = (state: DraftsState) => state.filterStatus;
