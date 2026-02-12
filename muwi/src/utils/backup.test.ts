import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { Draft } from '@/types/drafts';
import { defaultGlobalSettings } from '@/types/settings';
import {
  backupToJSON,
  createBackup,
  getBackupStats,
  isAutoBackupRunning,
  loadBackupFromFile,
  parseBackupJSON,
  performAutoBackup,
  restoreBackup,
  saveBackupToFile,
  startAutoBackup,
  stopAutoBackup,
  validateBackup,
} from './backup';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-12T13:00:00.000Z');
  return {
    id: 'draft-1',
    title: 'Backup Draft',
    content: '<p>content</p>',
    status: 'in-progress',
    wordCount: 1,
    tags: [],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('backup utils', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    stopAutoBackup();
  });

  afterEach(() => {
    stopAutoBackup();
    vi.useRealTimers();
  });

  it('creates backup snapshots/json and returns database stats', async () => {
    await db.drafts.put(makeDraft());
    await db.settings.put(defaultGlobalSettings);

    const backup = await createBackup();
    expect(backup.metadata.tableCount).toBe(15);
    expect(backup.metadata.totalRecords).toBe(2);
    expect(backup.data.drafts).toHaveLength(1);
    expect(backup.data.settings).toHaveLength(1);

    const json = backupToJSON(backup);
    expect(typeof json).toBe('string');
    expect(json).toContain('"metadata"');

    const stats = await getBackupStats();
    expect(stats.totalRecords).toBe(2);
    expect(stats.estimatedSize).toBe('1000 B');
    expect(stats.tables.find((table) => table.name === 'Drafts')?.count).toBe(1);
  });

  it('validates and parses backup JSON and reports invalid formats', async () => {
    await db.drafts.put(makeDraft());
    const backup = await createBackup();

    expect(validateBackup(backup)).toBe(true);
    expect(validateBackup({})).toBe(false);

    const parsed = parseBackupJSON(backupToJSON(backup));
    expect(parsed.metadata.version).toBe('1.0.0');

    expect(() => parseBackupJSON('{invalid')).toThrow('Invalid JSON format');
    expect(() =>
      parseBackupJSON(
        JSON.stringify({
          metadata: { version: '1.0.0', createdAt: new Date().toISOString() },
          data: {},
        })
      )
    ).toThrow('Invalid backup format');
  });

  it('restores backup data and rejects incompatible backup versions', async () => {
    await db.drafts.put(makeDraft());
    await db.settings.put(defaultGlobalSettings);
    const backup = await createBackup();

    await clearDatabase(db);
    const restored = await restoreBackup(backup);
    expect(restored.success).toBe(true);
    expect(restored.recordsRestored).toBe(2);
    expect(await db.drafts.count()).toBe(1);
    expect(await db.settings.count()).toBe(1);

    const incompatibleBackup = {
      ...backup,
      metadata: { ...backup.metadata, version: '2.0.0' },
    };
    const incompatibleResult = await restoreBackup(incompatibleBackup);
    expect(incompatibleResult.success).toBe(false);
    expect(incompatibleResult.error).toContain('Incompatible backup version');
  });

  it('saves and loads backup files through Electron API methods', async () => {
    await db.drafts.put(makeDraft());
    const backup = await createBackup();
    const backupJson = backupToJSON(backup);

    const saveBackup = vi.fn().mockResolvedValue('/tmp/muwi-backup.json');
    const loadBackup = vi.fn().mockResolvedValue(backupJson);
    window.electronAPI.saveBackup = saveBackup;
    window.electronAPI.loadBackup = loadBackup;

    const saved = await saveBackupToFile(backup);
    expect(saved.success).toBe(true);
    expect(saved.filePath).toBe('/tmp/muwi-backup.json');
    expect(saved.recordCount).toBe(backup.metadata.totalRecords);

    saveBackup.mockResolvedValueOnce(null);
    const cancelled = await saveBackupToFile(backup);
    expect(cancelled.success).toBe(false);
    expect(cancelled.error).toBe('Backup cancelled by user');

    await clearDatabase(db);
    const loaded = await loadBackupFromFile();
    expect(loaded.success).toBe(true);
    expect(await db.drafts.count()).toBe(1);

    loadBackup.mockResolvedValueOnce(null);
    const noFile = await loadBackupFromFile();
    expect(noFile.success).toBe(false);
    expect(noFile.error).toBe('No backup file selected');
  });

  it('performs and schedules auto-backups', async () => {
    const saveBackup = vi.fn().mockResolvedValue('/tmp/muwi-auto-backup.json');
    window.electronAPI.saveBackup = saveBackup;

    const immediate = await performAutoBackup('/tmp');
    expect(immediate.success).toBe(true);
    expect(immediate.filePath).toBe('/tmp/muwi-auto-backup.json');

    delete window.electronAPI.saveBackup;
    const noElectron = await performAutoBackup('/tmp');
    expect(noElectron.success).toBe(false);
    expect(noElectron.error).toBe('Auto-backup requires Electron environment');

    window.electronAPI.saveBackup = saveBackup;
    const onComplete = vi.fn();
    startAutoBackup(
      {
        enabled: true,
        frequency: 'hourly',
        location: '/tmp',
        maxBackups: 5,
        lastBackup: new Date().toISOString(),
      },
      onComplete
    );

    expect(isAutoBackupRunning()).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();

    stopAutoBackup();
    expect(isAutoBackupRunning()).toBe(false);
  });
});
