import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { defaultGlobalSettings } from '@/types';
import {
  clearPasskey,
  getAllLockedContent,
  getGlobalSettings,
  getLockedContentByType,
  hasPasskey,
  isContentLocked,
  lockContent,
  setPasskey,
  unlockContent,
  updateGlobalSettings,
  verifyPasskey,
} from './settings';

describe('settings queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('returns default settings and applies updates', async () => {
    const settings = await getGlobalSettings();
    expect(settings).toEqual(defaultGlobalSettings);

    await updateGlobalSettings({
      theme: 'dark',
      accentColor: '#000000',
      shelfLayout: 'list',
    });

    const updated = await getGlobalSettings();
    expect(updated.theme).toBe('dark');
    expect(updated.accentColor).toBe('#000000');
    expect(updated.shelfLayout).toBe('list');
  });

  it('manages passkeys and clears locked content when passkey is removed', async () => {
    expect(await hasPasskey()).toBe(false);

    await setPasskey('hash-1', 'salt-1', 'hint');
    expect(await hasPasskey()).toBe(true);
    expect(await verifyPasskey('hash-1')).toBe(true);
    expect(await verifyPasskey('wrong-hash')).toBe(false);

    await lockContent('draft', 'draft-1');
    await lockContent('entry', 'entry-1');
    expect(await getAllLockedContent()).toHaveLength(2);

    await clearPasskey();
    expect(await hasPasskey()).toBe(false);
    expect(await getAllLockedContent()).toHaveLength(0);
  });

  it('locks and unlocks individual content records', async () => {
    await lockContent('section', 'section-1');
    await lockContent('section', 'section-2');
    await lockContent('draft', 'draft-3');

    expect(await isContentLocked('section', 'section-1')).toBe(true);
    expect(await isContentLocked('section', 'section-99')).toBe(false);

    const sectionLocks = await getLockedContentByType('section');
    expect(sectionLocks).toHaveLength(2);

    await unlockContent('section', 'section-1');
    expect(await isContentLocked('section', 'section-1')).toBe(false);
    expect(await getLockedContentByType('section')).toHaveLength(1);
  });
});
