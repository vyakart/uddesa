import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format } from 'date-fns';
import type { DiaryEntry } from '@/types/diary';
import { db } from '@/db/database';

interface PersonalDiaryState {
  entries: DiaryEntry[];
  currentEntry: DiaryEntry | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: () => Promise<void>;
  loadEntry: (date: Date) => Promise<void>;
  createEntry: (date: Date, content?: string) => Promise<DiaryEntry>;
  updateEntry: (id: string, content: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setCurrentEntry: (entry: DiaryEntry | null) => void;
}

// Helper to format date as ISO string (YYYY-MM-DD)
function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export const usePersonalDiaryStore = create<PersonalDiaryState>()(
  devtools(
    (set, get) => ({
      entries: [],
      currentEntry: null,
      isLoading: false,
      error: null,

      loadEntries: async () => {
        set({ isLoading: true, error: null });
        try {
          const entries = await db.diaryEntries
            .orderBy('date')
            .reverse()
            .toArray();
          set({ entries, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load entries',
            isLoading: false
          });
        }
      },

      loadEntry: async (date: Date) => {
        set({ isLoading: true, error: null });
        try {
          const dateString = formatDateString(date);

          const entry = await db.diaryEntries
            .where('date')
            .equals(dateString)
            .first();

          if (entry) {
            set({ currentEntry: entry, isLoading: false });
          } else {
            // Create a new entry for this date
            const newEntry = await get().createEntry(date);
            set({ currentEntry: newEntry, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load entry',
            isLoading: false
          });
        }
      },

      createEntry: async (date: Date, content: string = '') => {
        const now = new Date();
        const newEntry: DiaryEntry = {
          id: crypto.randomUUID(),
          date: formatDateString(date),
          content: content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
          isLocked: false,
          createdAt: now,
          modifiedAt: now,
        };

        await db.diaryEntries.add(newEntry);

        // Update local state
        set((state) => ({
          entries: [newEntry, ...state.entries].sort(
            (a, b) => b.date.localeCompare(a.date)
          ),
        }));

        return newEntry;
      },

      updateEntry: async (id: string, content: string) => {
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const modifiedAt = new Date();

        await db.diaryEntries.update(id, {
          content,
          wordCount,
          modifiedAt,
        });

        // Update local state
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, content, wordCount, modifiedAt }
              : entry
          ),
          currentEntry:
            state.currentEntry?.id === id
              ? { ...state.currentEntry, content, wordCount, modifiedAt }
              : state.currentEntry,
        }));
      },

      deleteEntry: async (id: string) => {
        await db.diaryEntries.delete(id);

        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          currentEntry:
            state.currentEntry?.id === id ? null : state.currentEntry,
        }));
      },

      setCurrentEntry: (entry) => {
        set({ currentEntry: entry });
      },
    }),
    { name: 'personal-diary-store' }
  )
);

// Selectors
export const selectDiaryEntries = (state: PersonalDiaryState) => state.entries;
export const selectDiaryCurrentEntry = (state: PersonalDiaryState) => state.currentEntry;
export const selectDiaryIsLoading = (state: PersonalDiaryState) => state.isLoading;
