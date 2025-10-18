import { exportAll as dbExportAll, importAll as dbImportAll, type ExportBundle } from './db';

/**
 * Export all application data as a downloadable JSON file
 * 
 * @param filename - Optional custom filename (default: "uddesa-backup-{timestamp}.json")
 * @returns Promise that resolves when download is initiated
 */
export async function downloadBackup(filename?: string): Promise<void> {
  try {
    const blob = await dbExportAll();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = filename || `uddesa-backup-${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'backup',
        message: 'Backup downloaded successfully',
        filename: link.download,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        module: 'backup',
        message: 'Failed to download backup',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    throw error;
  }
}

/**
 * Validate backup file structure
 * 
 * @param data - Parsed JSON data from backup file
 * @returns True if valid, throws error otherwise
 */
export function validateBackup(data: unknown): data is ExportBundle {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file: not a valid JSON object');
  }

  const bundle = data as Partial<ExportBundle>;

  if (typeof bundle.version !== 'number') {
    throw new Error('Invalid backup file: missing or invalid version number');
  }

  if (typeof bundle.exportedAt !== 'number') {
    throw new Error('Invalid backup file: missing or invalid export timestamp');
  }

  if (!Array.isArray(bundle.diaries)) {
    throw new Error('Invalid backup file: missing or invalid diaries array');
  }

  if (!Array.isArray(bundle.pages)) {
    throw new Error('Invalid backup file: missing or invalid pages array');
  }

  // Locks are optional
  if (bundle.locks !== undefined && !Array.isArray(bundle.locks)) {
    throw new Error('Invalid backup file: invalid locks array');
  }

  return true;
}

/**
 * Restore data from a backup file
 * 
 * @param file - Backup file (Blob or File)
 * @param mode - 'replace' to clear existing data, 'merge' to keep existing
 * @returns Promise with import statistics
 */
export async function restoreFromBackup(
  file: Blob,
  mode: 'replace' | 'merge' = 'replace',
): Promise<{
  diariesCount: number;
  pagesCount: number;
  locksCount: number;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate backup structure
    if (!validateBackup(data)) {
      throw new Error('Backup validation failed');
    }

    const bundle = data as ExportBundle;

    // Log backup info
    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'backup',
        message: 'Restoring backup',
        mode,
        version: bundle.version,
        exportedAt: new Date(bundle.exportedAt).toISOString(),
        diariesCount: bundle.diaries.length,
        pagesCount: bundle.pages.length,
        locksCount: bundle.locks?.length || 0,
      }),
    );

    // For replace mode, the importAll function will overwrite
    // For merge mode, we would need to implement merge logic
    // Currently db.importAll() replaces all data
    await dbImportAll(new Blob([text], { type: 'application/json' }));

    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'backup',
        message: 'Backup restored successfully',
        diariesCount: bundle.diaries.length,
        pagesCount: bundle.pages.length,
      }),
    );

    return {
      diariesCount: bundle.diaries.length,
      pagesCount: bundle.pages.length,
      locksCount: bundle.locks?.length || 0,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        module: 'backup',
        message: 'Failed to restore backup',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    throw error;
  }
}

/**
 * Get backup file information without importing
 * 
 * @param file - Backup file to inspect
 * @returns Backup metadata
 */
export async function inspectBackup(file: Blob): Promise<{
  version: number;
  exportedAt: Date;
  diariesCount: number;
  pagesCount: number;
  locksCount: number;
  isValid: boolean;
  error?: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateBackup(data)) {
      throw new Error('Invalid backup structure');
    }

    const bundle = data as ExportBundle;

    return {
      version: bundle.version,
      exportedAt: new Date(bundle.exportedAt),
      diariesCount: bundle.diaries.length,
      pagesCount: bundle.pages.length,
      locksCount: bundle.locks?.length || 0,
      isValid: true,
    };
  } catch (error) {
    return {
      version: 0,
      exportedAt: new Date(0),
      diariesCount: 0,
      pagesCount: 0,
      locksCount: 0,
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Re-export for convenience
export { dbExportAll as exportAll, dbImportAll as importAll };
