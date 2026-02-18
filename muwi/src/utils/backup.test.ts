import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { Draft } from '@/types/drafts';
import { defaultGlobalSettings } from '@/types/settings';
import {
  type BackupData,
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

const REQUIRED_BACKUP_TABLES = [
  'scratchpadPages',
  'textBlocks',
  'blackboardCanvases',
  'canvasElements',
  'diaryEntries',
  'drafts',
  'longDrafts',
  'sections',
  'academicPapers',
  'academicSections',
  'bibliographyEntries',
  'citations',
  'figures',
  'settings',
  'lockedContent',
] as const;

function makeBackup(overrides: Partial<BackupData> = {}): BackupData {
  const base: BackupData = {
    metadata: {
      version: '1.0.0',
      createdAt: new Date('2026-02-12T13:00:00.000Z').toISOString(),
      appVersion: '1.0.0',
      tableCount: 15,
      totalRecords: 0,
    },
    data: {
      scratchpadPages: [],
      textBlocks: [],
      blackboardCanvases: [],
      canvasElements: [],
      diaryEntries: [],
      drafts: [],
      longDrafts: [],
      sections: [],
      academicPapers: [],
      academicSections: [],
      bibliographyEntries: [],
      citations: [],
      figures: [],
      settings: [],
      lockedContent: [],
    },
  };

  return {
    ...base,
    ...overrides,
    metadata: {
      ...base.metadata,
      ...overrides.metadata,
    },
    data: {
      ...base.data,
      ...overrides.data,
    },
  };
}

function makeFullyPopulatedBackup(): BackupData {
  const one = [{} as never];
  return makeBackup({
    metadata: {
      totalRecords: 15,
    },
    data: {
      scratchpadPages: one,
      textBlocks: one,
      blackboardCanvases: one,
      canvasElements: one,
      diaryEntries: one,
      drafts: one,
      longDrafts: one,
      sections: one,
      academicPapers: one,
      academicSections: one,
      bibliographyEntries: one,
      citations: one,
      figures: one,
      settings: one,
      lockedContent: one,
    },
  });
}

describe('backup utils', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    stopAutoBackup();
  });

  afterEach(() => {
    stopAutoBackup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates backup snapshots/json and returns database stats', async () => {
    await db.drafts.put(makeDraft());
    await db.settings.put(defaultGlobalSettings);

    const backup = await createBackup();
    expect(backup.metadata.tableCount).toBe(REQUIRED_BACKUP_TABLES.length);
    expect(backup.metadata.totalRecords).toBe(2);
    expect(Object.keys(backup.data).sort()).toEqual([...REQUIRED_BACKUP_TABLES].sort());
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
    expect(validateBackup(null)).toBe(false);
    expect(validateBackup({})).toBe(false);
    expect(validateBackup({ metadata: {}, data: backup.data })).toBe(false);
    expect(validateBackup({ metadata: { ...backup.metadata, version: 'v1' }, data: backup.data })).toBe(false);
    expect(
      validateBackup({ metadata: { ...backup.metadata, createdAt: 'not-a-date' }, data: backup.data })
    ).toBe(false);
    expect(
      validateBackup({ metadata: { ...backup.metadata, tableCount: 14 }, data: backup.data })
    ).toBe(false);
    expect(
      validateBackup({ metadata: { ...backup.metadata, totalRecords: -1 }, data: backup.data })
    ).toBe(false);
    expect(validateBackup({ metadata: { version: '1.0.0', createdAt: new Date().toISOString() }, data: null })).toBe(
      false
    );

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

  it('wraps create backup errors with a descriptive message', async () => {
    vi.spyOn(db.drafts, 'toArray').mockRejectedValueOnce(new Error('dexie exploded'));
    await expect(createBackup()).rejects.toThrow('Failed to create backup: dexie exploded');
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

    const invalidVersionBackup = {
      ...backup,
      metadata: { ...backup.metadata, version: 'invalid' },
    };
    const invalidVersionResult = await restoreBackup(invalidVersionBackup);
    expect(invalidVersionResult).toEqual({ success: false, error: 'Invalid backup format' });
  });

  it('restores all non-empty tables when clearExisting is false and handles restore failures', async () => {
    const backup = makeFullyPopulatedBackup();
    const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(
      async (_mode, _tables, callback) => await callback()
    );

    const bulkPutSpies = [
      vi.spyOn(db.scratchpadPages, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.textBlocks, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.blackboardCanvases, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.canvasElements, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.diaryEntries, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.drafts, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.longDrafts, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.sections, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.academicPapers, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.academicSections, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.bibliographyEntries, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.citations, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.figures, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.settings, 'bulkPut').mockResolvedValue(undefined as never),
      vi.spyOn(db.lockedContent, 'bulkPut').mockResolvedValue(undefined as never),
    ];

    const result = await restoreBackup(backup, false);
    expect(result).toMatchObject({
      success: true,
      recordsRestored: 15,
      tablesRestored: 15,
    });
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    bulkPutSpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));

    const invalid = await restoreBackup({} as BackupData);
    expect(invalid).toEqual({ success: false, error: 'Invalid backup format' });

    transactionSpy.mockRejectedValueOnce('boom' as never);
    const failed = await restoreBackup(makeBackup(), false);
    expect(failed).toEqual({ success: false, error: 'Unknown error occurred during restore' });
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

  it('handles save/load backup fallback branches for web mode and error paths', async () => {
    delete window.electronAPI.saveBackup;
    delete window.electronAPI.loadBackup;

    const url = 'blob:muwi-backup';
    const clickSpy = vi.fn();
    const anchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(url);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return anchor;
      }
      if (tagName === 'input') {
        const input = {
          type: '',
          accept: '',
          onchange: null as ((e: Event) => void) | null,
          click: vi.fn(),
        } as unknown as HTMLInputElement;
        input.click = vi.fn(() => {
          input.onchange?.({ target: { files: [] } } as unknown as Event);
        });
        return input;
      }
      return originalCreateElement(tagName);
    });

    const saved = await saveBackupToFile();
    expect(saved.success).toBe(true);
    expect(saved.filePath).toMatch(/^muwi-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const saveError = vi.fn().mockRejectedValue('save exploded');
    window.electronAPI.saveBackup = saveError;
    const saveFailed = await saveBackupToFile(makeBackup());
    expect(saveFailed).toEqual({ success: false, error: 'Unknown error occurred' });

    const noSelection = await loadBackupFromFile();
    expect(noSelection).toEqual({ success: false, error: 'No backup file selected' });

    window.electronAPI.loadBackup = vi.fn().mockResolvedValue('{invalid');
    const parseError = await loadBackupFromFile();
    expect(parseError).toEqual({ success: false, error: 'Invalid JSON format' });
  });

  it('loads backup from web file input and supports file-reader branches', async () => {
    delete window.electronAPI.loadBackup;
    const backupJson = backupToJSON(
      makeBackup({
        metadata: { totalRecords: 1 },
        data: { drafts: [makeDraft()] },
      })
    );

    class FileReaderSuccessMock {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      result: string | null = null;
      readAsText = vi.fn(() => {
        this.result = backupJson;
        this.onload?.();
      });
    }

    vi.stubGlobal('FileReader', FileReaderSuccessMock as unknown as typeof FileReader);
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName !== 'input') return originalCreateElement(tagName);
      const input = originalCreateElement('input');
      input.click = vi.fn(() => {
        input.onchange?.({ target: { files: [{}] } } as unknown as Event);
      });
      return input;
    });

    const loaded = await loadBackupFromFile();
    expect(loaded.success).toBe(true);
    expect(await db.drafts.count()).toBe(1);

    class FileReaderErrorMock {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsText = vi.fn(() => {
        this.onerror?.();
      });
    }

    vi.stubGlobal('FileReader', FileReaderErrorMock as unknown as typeof FileReader);
    const readError = await loadBackupFromFile();
    expect(readError).toEqual({ success: false, error: 'No backup file selected' });
  });

  it('performs and schedules auto-backups', async () => {
    const saveBackup = vi.fn().mockResolvedValue('/tmp/muwi-auto-backup.json');
    window.electronAPI.saveBackup = saveBackup;

    const immediate = await performAutoBackup('/tmp');
    expect(immediate.success).toBe(true);
    expect(immediate.filePath).toBe('/tmp/muwi-auto-backup.json');
    expect(saveBackup).toHaveBeenCalledWith(expect.any(String), '/tmp', 10);

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

  it('covers auto-backup error and scheduler interval branches', async () => {
    const saveBackup = vi.fn().mockResolvedValue('/tmp/scheduled.json');
    window.electronAPI.saveBackup = saveBackup;

    let scheduledCallback: (() => Promise<void>) | null = null;
    const dailyIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((callback) => {
      scheduledCallback = callback as () => Promise<void>;
      return 1 as unknown as ReturnType<typeof setInterval>;
    });
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    const onComplete = vi.fn();
    startAutoBackup(
      {
        enabled: true,
        frequency: 'daily',
        location: '/tmp',
        maxBackups: 3,
      },
      onComplete
    );
    expect(dailyIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
    await scheduledCallback?.();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, filePath: '/tmp/scheduled.json' })
    );
    expect(saveBackup).toHaveBeenLastCalledWith(expect.any(String), '/tmp', 3);

    stopAutoBackup();
    startAutoBackup({
      enabled: true,
      frequency: 'weekly',
      location: '/tmp',
      maxBackups: 3,
    });
    expect(dailyIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 7 * 24 * 60 * 60 * 1000);

    stopAutoBackup();
    startAutoBackup({
      enabled: true,
      frequency: 'hourly',
      location: '/tmp',
      maxBackups: 3,
      lastBackup: '2020-01-01T00:00:00.000Z',
    });
    await Promise.resolve();
    expect(saveBackup).toHaveBeenCalled();
    expect(saveBackup).toHaveBeenLastCalledWith(expect.any(String), '/tmp', 3);

    stopAutoBackup();
    startAutoBackup({ enabled: false, frequency: 'hourly', location: '/tmp', maxBackups: 3 });
    expect(isAutoBackupRunning()).toBe(false);

    startAutoBackup({ enabled: true, frequency: 'hourly', location: '', maxBackups: 3 });
    expect(isAutoBackupRunning()).toBe(false);

    startAutoBackup({
      enabled: true,
      frequency: 'unknown' as never,
      location: '/tmp',
      maxBackups: 3,
    });
    expect(dailyIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);

    window.electronAPI.saveBackup = vi.fn().mockRejectedValue(new Error('auto failed'));
    const autoError = await performAutoBackup('/tmp');
    expect(autoError).toEqual({ success: false, error: 'auto failed' });

    window.electronAPI.saveBackup = vi.fn().mockRejectedValue('auto failed');
    const autoUnknown = await performAutoBackup('/tmp');
    expect(autoUnknown).toEqual({ success: false, error: 'Auto-backup failed' });
  });

  it('formats backup size in B, KB, and MB ranges', async () => {
    const countSpies = [
      vi.spyOn(db.scratchpadPages, 'count'),
      vi.spyOn(db.textBlocks, 'count'),
      vi.spyOn(db.blackboardCanvases, 'count'),
      vi.spyOn(db.canvasElements, 'count'),
      vi.spyOn(db.diaryEntries, 'count'),
      vi.spyOn(db.drafts, 'count'),
      vi.spyOn(db.longDrafts, 'count'),
      vi.spyOn(db.sections, 'count'),
      vi.spyOn(db.academicPapers, 'count'),
      vi.spyOn(db.academicSections, 'count'),
      vi.spyOn(db.bibliographyEntries, 'count'),
      vi.spyOn(db.citations, 'count'),
      vi.spyOn(db.figures, 'count'),
      vi.spyOn(db.settings, 'count'),
      vi.spyOn(db.lockedContent, 'count'),
    ];

    countSpies.forEach((spy, index) => spy.mockResolvedValue(index < 3 ? 1 : 0));
    expect((await getBackupStats()).estimatedSize).toBe('1.5 KB');

    countSpies.forEach((spy, index) => spy.mockResolvedValue(index === 0 ? 2100 : 0));
    expect((await getBackupStats()).estimatedSize).toBe('1.0 MB');
  });
});
