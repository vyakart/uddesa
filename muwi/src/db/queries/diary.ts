import { db } from '../database';
import type { DiaryEntry } from '@/types';

// Diary Entries CRUD

export async function createEntry(entry: DiaryEntry): Promise<string> {
  return db.diaryEntries.add(entry);
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  return db.diaryEntries.get(id);
}

export async function getEntryByDate(date: string): Promise<DiaryEntry | undefined> {
  return db.diaryEntries.where('date').equals(date).first();
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  return db.diaryEntries.orderBy('date').reverse().toArray();
}

export async function getEntriesByDateRange(startDate: string, endDate: string): Promise<DiaryEntry[]> {
  return db.diaryEntries
    .where('date')
    .between(startDate, endDate, true, true)
    .reverse()
    .toArray();
}

export async function getEntriesByMonth(year: number, month: number): Promise<DiaryEntry[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return getEntriesByDateRange(startDate, endDate);
}

export async function updateEntry(id: string, updates: Partial<DiaryEntry>): Promise<number> {
  return db.diaryEntries.update(id, { ...updates, modifiedAt: new Date() });
}

export async function deleteEntry(id: string): Promise<void> {
  await db.diaryEntries.delete(id);
}

export async function getOrCreateTodayEntry(): Promise<DiaryEntry> {
  const today = new Date().toISOString().split('T')[0];
  let entry = await getEntryByDate(today);

  if (!entry) {
    entry = {
      id: crypto.randomUUID(),
      date: today,
      content: '',
      wordCount: 0,
      isLocked: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    await createEntry(entry);
  }

  return entry;
}

export async function getEntryDates(): Promise<string[]> {
  const entries = await db.diaryEntries.orderBy('date').keys();
  return entries as string[];
}
