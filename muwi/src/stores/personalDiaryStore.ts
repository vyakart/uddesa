import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
          // Normalize the date to start of day
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const entry = await db.diaryEntries
            .where('date')
            .between(startOfDay, endOfDay, true, true)
            .first();

          if (entry) {
            set({ currentEntry: entry, isLoading: false });
          } else {
            // Create a new entry for this date
            const newEntry = await get().createEntry(startOfDay);
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
          date: date,
          content: content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
          isLocked: false,
          createdAt: now,
          updatedAt: now,
        };

        await db.diaryEntries.add(newEntry);

        // Update local state
        set((state) => ({
          entries: [newEntry, ...state.entries].sort(
            (a, b) => b.date.getTime() - a.date.getTime()
          ),
        }));

        return newEntry;
      },

      updateEntry: async (id: string, content: string) => {
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const updatedAt = new Date();

        await db.diaryEntries.update(id, {
          content,
          wordCount,
          updatedAt,
        });

        // Update local state
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, content, wordCount, updatedAt }
              : entry
          ),
          currentEntry:
            state.currentEntry?.id === id
              ? { ...state.currentEntry, content, wordCount, updatedAt }
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
export const selectEntries = (state: PersonalDiaryState) => state.entries;
export const selectCurrentEntry = (state: PersonalDiaryState) => state.currentEntry;
export const selectIsLoading = (state: PersonalDiaryState) => state.isLoading;
