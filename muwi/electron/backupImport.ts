import fs from 'fs/promises';
import path from 'path';

export const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

type BackupFileStats = {
  isFile(): boolean;
  size: number;
};

type BackupImportDeps = {
  stat: (targetPath: string) => Promise<BackupFileStats>;
  readFile: (targetPath: string, encoding: 'utf-8') => Promise<string>;
};

export async function readValidatedBackupFile(
  rawSelectedPath: unknown,
  deps: Partial<BackupImportDeps> = {}
): Promise<string> {
  if (typeof rawSelectedPath !== 'string' || !rawSelectedPath.trim()) {
    throw new Error('Backup file could not be read');
  }

  const selectedPath = path.resolve(rawSelectedPath);
  if (path.extname(selectedPath).toLowerCase() !== '.json') {
    throw new Error('Unsupported backup file type');
  }

  const stat = await (deps.stat ?? fs.stat)(selectedPath).catch(() => null);
  if (!stat?.isFile()) {
    throw new Error('Backup file could not be read');
  }

  if (stat.size > MAX_BACKUP_BYTES) {
    throw new Error('Backup file exceeds size limit');
  }

  return (deps.readFile ?? fs.readFile)(selectedPath, 'utf-8');
}
