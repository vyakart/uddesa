import Dexie from 'dexie';
import { MUWIDatabase } from './database';
import { defaultGlobalSettings } from '@/types';

describe('MUWIDatabase migration scaffolding', () => {
  it('opens and preserves data from a v1 database under the v2 schema scaffold', async () => {
    const dbName = `muwi-migration-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const legacyDb = new Dexie(dbName);
    legacyDb.version(1).stores({
      settings: 'id',
    });

    await legacyDb.open();
    await legacyDb.table('settings').put({ ...defaultGlobalSettings });
    await legacyDb.close();

    const upgradedDb = new MUWIDatabase(dbName);
    await upgradedDb.open();

    const settings = await upgradedDb.settings.get('global');
    expect(settings?.id).toBe('global');
    expect(settings?.theme).toBe(defaultGlobalSettings.theme);

    await upgradedDb.delete();
  });
});
