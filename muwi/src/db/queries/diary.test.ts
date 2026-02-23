import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { DiaryEntry } from '@/types';
import {
  createEntry,
  deleteEntry,
  getAllEntries,
  getEntriesByDateRange,
  getEntriesByMonth,
  getEntry,
  getEntryByDate,
  getEntryDates,
  getOrCreateTodayEntry,
  updateEntry,
} from './diary';

function makeEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    date: '2026-02-06',
    content: 'Today was productive',
    wordCount: 3,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('diary queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('supports entry CRUD and date lookups', async () => {
    const entry = makeEntry();
    await createEntry(entry);

    expect((await getEntry(entry.id))?.id).toBe(entry.id);
    expect((await getEntryByDate('2026-02-06'))?.id).toBe(entry.id);

    await updateEntry(entry.id, { content: 'Updated content', wordCount: 2 });
    expect((await getEntry(entry.id))?.content).toBe('Updated content');

    await deleteEntry(entry.id);
    expect(await getEntry(entry.id)).toBeUndefined();
  });

  it('returns date range and month queries correctly', async () => {
    await createEntry(makeEntry({ date: '2026-02-01', content: 'A' }));
    await createEntry(makeEntry({ date: '2026-02-09', content: 'B' }));
    await createEntry(makeEntry({ date: '2026-02-15', content: 'C' }));
    await createEntry(makeEntry({ date: '2026-03-01', content: 'D' }));

    const febRange = await getEntriesByDateRange('2026-02-01', '2026-02-28');
    expect(febRange.map((entry) => entry.date)).toEqual(['2026-02-15', '2026-02-09', '2026-02-01']);

    const febMonth = await getEntriesByMonth(2026, 2);
    expect(febMonth).toHaveLength(3);
    expect(febMonth.some((entry) => entry.date === '2026-02-09')).toBe(true);
  });

  it('creates or returns today entry and returns sorted entry dates', async () => {
    const today = new Date().toISOString().split('T')[0];
    const existingToday = makeEntry({ date: today, content: 'Existing today' });
    await createEntry(makeEntry({ date: '2026-01-03' }));
    await createEntry(existingToday);

    const todayEntry = await getOrCreateTodayEntry();
    expect(todayEntry.id).toBe(existingToday.id);

    const allEntries = await getAllEntries();
    const entriesForToday = allEntries.filter((entry) => entry.date === today);
    expect(entriesForToday).toHaveLength(1);

    const dates = await getEntryDates();
    expect(dates).toContain(today);
    expect(dates).toEqual([...dates].sort());
  });

  it('creates today entry when one does not exist', async () => {
    const today = new Date().toISOString().split('T')[0];

    const created = await getOrCreateTodayEntry();
    expect(created.date).toBe(today);
    expect(created.content).toBe('');
    expect(created.wordCount).toBe(0);
    expect(created.isLocked).toBe(false);

    const fetchedAgain = await getOrCreateTodayEntry();
    expect(fetchedAgain.id).toBe(created.id);

    const entriesForToday = (await getAllEntries()).filter((entry) => entry.date === today);
    expect(entriesForToday).toHaveLength(1);
  });
});
