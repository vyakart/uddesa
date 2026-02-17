import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { DiaryEntry } from '@/types';
import { usePersonalDiaryStore } from './personalDiaryStore';

function makeEntry(date: string, content: string): DiaryEntry {
  const now = new Date('2026-02-06T08:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    date,
    content,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
  };
}

describe('personalDiaryStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    usePersonalDiaryStore.setState(usePersonalDiaryStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads entries sorted by date descending', async () => {
    await db.diaryEntries.bulkAdd([
      makeEntry('2026-02-03', 'third day'),
      makeEntry('2026-02-05', 'fifth day'),
      makeEntry('2026-02-04', 'fourth day'),
    ]);

    await usePersonalDiaryStore.getState().loadEntries();

    expect(usePersonalDiaryStore.getState().entries.map((entry) => entry.date)).toEqual([
      '2026-02-05',
      '2026-02-04',
      '2026-02-03',
    ]);
  });

  it('loads existing entry by date and creates one if missing', async () => {
    const existing = makeEntry('2026-02-07', 'already exists');
    await db.diaryEntries.add(existing);

    const state = usePersonalDiaryStore.getState();
    await state.loadEntry(new Date('2026-02-07T12:00:00.000Z'));
    expect(usePersonalDiaryStore.getState().currentEntry?.id).toBe(existing.id);

    await state.loadEntry(new Date('2026-02-08T12:00:00.000Z'));
    const createdEntry = usePersonalDiaryStore.getState().currentEntry;
    expect(createdEntry?.date).toBe('2026-02-08');

    const allEntries = await db.diaryEntries.toArray();
    expect(allEntries).toHaveLength(2);
  });

  it('updates content and recalculates word count', async () => {
    const state = usePersonalDiaryStore.getState();
    const created = await state.createEntry(new Date('2026-02-09T12:00:00.000Z'), 'initial');
    state.setCurrentEntry(created);

    await state.updateEntry(created.id, 'one two three');

    const updatedFromStore = usePersonalDiaryStore
      .getState()
      .entries.find((entry) => entry.id === created.id);
    expect(updatedFromStore?.wordCount).toBe(3);
    expect(updatedFromStore?.content).toBe('one two three');

    const updatedFromDb = await db.diaryEntries.get(created.id);
    expect(updatedFromDb?.wordCount).toBe(3);
    expect(updatedFromDb?.content).toBe('one two three');
  });

  it('handles load errors and covers update/delete non-current branches', async () => {
    vi.spyOn(db.diaryEntries, 'orderBy').mockReturnValue({
      reverse: () => ({
        toArray: () => Promise.reject('entries-fallback'),
      }),
    } as never);
    await usePersonalDiaryStore.getState().loadEntries();
    expect(usePersonalDiaryStore.getState().error).toBe('Failed to load entries');

    vi.spyOn(db.diaryEntries, 'where').mockReturnValue({
      equals: () => ({
        first: () => Promise.reject(new Error('entry load error')),
      }),
    } as never);
    await usePersonalDiaryStore.getState().loadEntry(new Date('2026-02-10T12:00:00.000Z'));
    expect(usePersonalDiaryStore.getState().error).toBe('entry load error');

    vi.restoreAllMocks();

    const first = await usePersonalDiaryStore
      .getState()
      .createEntry(new Date('2026-02-10T12:00:00.000Z'), 'first entry');
    const second = await usePersonalDiaryStore
      .getState()
      .createEntry(new Date('2026-02-11T12:00:00.000Z'), 'second entry');

    usePersonalDiaryStore.getState().setCurrentEntry(first);
    await usePersonalDiaryStore.getState().updateEntry(second.id, 'updated second entry');
    expect(usePersonalDiaryStore.getState().currentEntry?.id).toBe(first.id);

    await usePersonalDiaryStore.getState().deleteEntry(second.id);
    expect(usePersonalDiaryStore.getState().currentEntry?.id).toBe(first.id);

    await usePersonalDiaryStore.getState().deleteEntry(first.id);
    expect(usePersonalDiaryStore.getState().currentEntry).toBeNull();
  });
});
