import { db } from '@/db';
import { clearDatabase, seedDatabase } from './db-utils';

describe('db-utils', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('seeds scratchpad, diary, drafts, and settings data', async () => {
    const seeded = await seedDatabase(db, {
      pages: 2,
      blocksPerPage: 3,
      entries: 4,
      drafts: 2,
      includeSettings: true,
    });

    expect(seeded.pages).toHaveLength(2);
    expect(seeded.textBlocks).toHaveLength(6);
    expect(seeded.entries).toHaveLength(4);
    expect(seeded.drafts).toHaveLength(2);

    await expect(db.scratchpadPages.count()).resolves.toBe(2);
    await expect(db.textBlocks.count()).resolves.toBe(6);
    await expect(db.diaryEntries.count()).resolves.toBe(4);
    await expect(db.drafts.count()).resolves.toBe(2);

    const settings = await db.settings.get('global');
    expect(settings).toBeDefined();
    expect(settings?.id).toBe('global');
  });

  it('clears all database tables', async () => {
    await seedDatabase(db);
    await clearDatabase(db);

    await expect(db.scratchpadPages.count()).resolves.toBe(0);
    await expect(db.textBlocks.count()).resolves.toBe(0);
    await expect(db.diaryEntries.count()).resolves.toBe(0);
    await expect(db.drafts.count()).resolves.toBe(0);
    await expect(db.settings.count()).resolves.toBe(0);
  });
});
