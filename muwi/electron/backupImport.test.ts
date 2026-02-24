// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { MAX_BACKUP_BYTES, readValidatedBackupFile } from './backupImport';

describe('readValidatedBackupFile', () => {
  it('rejects non-json files before attempting to read', async () => {
    const stat = vi.fn();
    const readFile = vi.fn();

    await expect(
      readValidatedBackupFile('/tmp/not-a-backup.txt', { stat, readFile })
    ).rejects.toThrow('Unsupported backup file type');

    expect(stat).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
  });

  it('rejects oversized backup files before attempting to read', async () => {
    const stat = vi.fn(async () => ({
      isFile: () => true,
      size: MAX_BACKUP_BYTES + 1,
    }));
    const readFile = vi.fn();

    await expect(
      readValidatedBackupFile('/tmp/muwi-backup.json', { stat, readFile })
    ).rejects.toThrow('Backup file exceeds size limit');

    expect(stat).toHaveBeenCalledTimes(1);
    expect(readFile).not.toHaveBeenCalled();
  });
});
