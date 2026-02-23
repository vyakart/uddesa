// Backup and restore utilities for MUWI database
import { db } from '@/db';
import type {
  ScratchpadPage,
  TextBlock,
  BlackboardCanvas,
  CanvasElement,
  DiaryEntry,
  Draft,
  LongDraft,
  Section,
  AcademicPaper,
  AcademicSection,
  BibliographyEntry,
  Citation,
  Figure,
  GlobalSettings,
  LockedContent,
} from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface BackupMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  tableCount: number;
  totalRecords: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    scratchpadPages: ScratchpadPage[];
    textBlocks: TextBlock[];
    blackboardCanvases: BlackboardCanvas[];
    canvasElements: CanvasElement[];
    diaryEntries: DiaryEntry[];
    drafts: Draft[];
    longDrafts: LongDraft[];
    sections: Section[];
    academicPapers: AcademicPaper[];
    academicSections: AcademicSection[];
    bibliographyEntries: BibliographyEntry[];
    citations: Citation[];
    figures: Figure[];
    settings: GlobalSettings[];
    lockedContent: LockedContent[];
  };
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  error?: string;
  recordCount?: number;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  recordsRestored?: number;
  tablesRestored?: number;
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  location: string;
  maxBackups: number;
  lastBackup?: string;
}

// Current backup schema version
const BACKUP_VERSION = '1.0.0';
const APP_VERSION = '1.0.0';
const MAX_BACKUP_JSON_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_TOTAL_RECORDS = 200_000;
const MAX_TABLE_RECORDS = 100_000;
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

type BackupTableName = (typeof REQUIRED_BACKUP_TABLES)[number];

function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date)) {
    return false;
  }
  const parsed = new Date(date);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === date;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function calculateRecordCount(data: BackupData['data']): number {
  return REQUIRED_BACKUP_TABLES.reduce((total, table) => total + data[table].length, 0);
}

function hasValidTableRows(tableRows: unknown[]): boolean {
  return tableRows.every((row) => isPlainRecord(row));
}

// ============================================================================
// Backup Creation
// ============================================================================

/**
 * Create a complete backup of all database tables
 */
export async function createBackup(): Promise<BackupData> {
  try {
    // Fetch all data from each table
    const [
      scratchpadPages,
      textBlocks,
      blackboardCanvases,
      canvasElements,
      diaryEntries,
      drafts,
      longDrafts,
      sections,
      academicPapers,
      academicSections,
      bibliographyEntries,
      citations,
      figures,
      settings,
      lockedContent,
    ] = await Promise.all([
      db.scratchpadPages.toArray(),
      db.textBlocks.toArray(),
      db.blackboardCanvases.toArray(),
      db.canvasElements.toArray(),
      db.diaryEntries.toArray(),
      db.drafts.toArray(),
      db.longDrafts.toArray(),
      db.sections.toArray(),
      db.academicPapers.toArray(),
      db.academicSections.toArray(),
      db.bibliographyEntries.toArray(),
      db.citations.toArray(),
      db.figures.toArray(),
      db.settings.toArray(),
      db.lockedContent.toArray(),
    ]);

    // Calculate total records
    const totalRecords =
      scratchpadPages.length +
      textBlocks.length +
      blackboardCanvases.length +
      canvasElements.length +
      diaryEntries.length +
      drafts.length +
      longDrafts.length +
      sections.length +
      academicPapers.length +
      academicSections.length +
      bibliographyEntries.length +
      citations.length +
      figures.length +
      settings.length +
      lockedContent.length;

    const backup: BackupData = {
      metadata: {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        tableCount: REQUIRED_BACKUP_TABLES.length,
        totalRecords,
      },
      data: {
        scratchpadPages,
        textBlocks,
        blackboardCanvases,
        canvasElements,
        diaryEntries,
        drafts,
        longDrafts,
        sections,
        academicPapers,
        academicSections,
        bibliographyEntries,
        citations,
        figures,
        settings,
        lockedContent,
      },
    };

    return backup;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    });
  }
}

/**
 * Export backup to JSON string
 */
export function backupToJSON(backup: BackupData): string {
  return JSON.stringify(backup, null, 2);
}

/**
 * Save backup to file using Electron API
 */
export async function saveBackupToFile(backup?: BackupData): Promise<BackupResult> {
  try {
    const data = backup || await createBackup();
    const jsonString = backupToJSON(data);

    if (window.electronAPI?.saveBackup) {
      const filePath = await window.electronAPI.saveBackup(jsonString);
      if (filePath) {
        return {
          success: true,
          filePath,
          recordCount: data.metadata.totalRecords,
        };
      }
      return { success: false, error: 'Backup cancelled by user' };
    }

    // Fallback for web: trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muwi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      filePath: a.download,
      recordCount: data.metadata.totalRecords,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ============================================================================
// Backup Restoration
// ============================================================================

/**
 * Validate backup data structure
 */
export function validateBackup(data: unknown): data is BackupData {
  if (!isPlainRecord(data)) {
    return false;
  }

  const metadata = data.metadata;
  const backupData = data.data;

  // Check metadata
  if (!isPlainRecord(metadata)) {
    return false;
  }

  if (
    typeof metadata.version !== 'string' ||
    typeof metadata.createdAt !== 'string' ||
    typeof metadata.appVersion !== 'string' ||
    !isValidSemver(metadata.version) ||
    !isValidSemver(metadata.appVersion) ||
    !isValidIsoDate(metadata.createdAt)
  ) {
    return false;
  }

  if (
    typeof metadata.tableCount !== 'number' ||
    !Number.isInteger(metadata.tableCount) ||
    metadata.tableCount !== REQUIRED_BACKUP_TABLES.length
  ) {
    return false;
  }

  if (
    typeof metadata.totalRecords !== 'number' ||
    !Number.isInteger(metadata.totalRecords) ||
    metadata.totalRecords < 0 ||
    metadata.totalRecords > MAX_TOTAL_RECORDS
  ) {
    return false;
  }

  // Check data object
  if (!isPlainRecord(backupData)) {
    return false;
  }

  // Check required tables exist (they can be empty arrays)
  let calculatedTotal = 0;
  for (const table of REQUIRED_BACKUP_TABLES) {
    const tableValue = backupData[table as BackupTableName];
    if (!Array.isArray(tableValue)) {
      return false;
    }

    if (tableValue.length > MAX_TABLE_RECORDS || !hasValidTableRows(tableValue)) {
      return false;
    }

    calculatedTotal += tableValue.length;
  }

  if (calculatedTotal !== metadata.totalRecords || calculatedTotal > MAX_TOTAL_RECORDS) {
    return false;
  }

  return true;
}

/**
 * Parse backup from JSON string
 */
export function parseBackupJSON(jsonString: string): BackupData {
  if (typeof jsonString !== 'string' || jsonString.trim().length === 0) {
    throw new Error('Backup file is empty');
  }

  if (new TextEncoder().encode(jsonString).byteLength > MAX_BACKUP_JSON_BYTES) {
    throw new Error('Backup file exceeds size limit');
  }

  try {
    const data = JSON.parse(jsonString);

    if (!validateBackup(data)) {
      throw new Error('Invalid backup format');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format', { cause: error });
    }
    throw error;
  }
}

/**
 * Restore database from backup data
 * This will REPLACE all existing data
 */
export async function restoreBackup(backup: BackupData, clearExisting = true): Promise<RestoreResult> {
  // Validate backup
  if (!validateBackup(backup)) {
    return { success: false, error: 'Invalid backup format' };
  }

  // Check version compatibility
  const [majorVersion] = backup.metadata.version.split('.');
  const [currentMajor] = BACKUP_VERSION.split('.');
  if (!isValidSemver(backup.metadata.version)) {
    return {
      success: false,
      error: `Invalid backup version format: ${backup.metadata.version}`,
    };
  }
  if (majorVersion !== currentMajor) {
    return {
      success: false,
      error: `Incompatible backup version: ${backup.metadata.version}. Current version: ${BACKUP_VERSION}`,
    };
  }

  if (calculateRecordCount(backup.data) !== backup.metadata.totalRecords) {
    return {
      success: false,
      error: 'Backup metadata record count does not match table contents',
    };
  }

  // Clear existing data if requested
  if (clearExisting) {
    try {
      await db.transaction('rw', db.tables, async () => {
        await Promise.all(db.tables.map((table) => table.clear()));
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear existing data: ${getErrorMessage(error, 'Unknown clear error')}`,
      };
    }
  }

  const dataToRestore = backup.data;
  try {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all([
        dataToRestore.scratchpadPages.length > 0 && db.scratchpadPages.bulkPut(dataToRestore.scratchpadPages),
        dataToRestore.textBlocks.length > 0 && db.textBlocks.bulkPut(dataToRestore.textBlocks),
        dataToRestore.blackboardCanvases.length > 0 && db.blackboardCanvases.bulkPut(dataToRestore.blackboardCanvases),
        dataToRestore.canvasElements.length > 0 && db.canvasElements.bulkPut(dataToRestore.canvasElements),
        dataToRestore.diaryEntries.length > 0 && db.diaryEntries.bulkPut(dataToRestore.diaryEntries),
        dataToRestore.drafts.length > 0 && db.drafts.bulkPut(dataToRestore.drafts),
        dataToRestore.longDrafts.length > 0 && db.longDrafts.bulkPut(dataToRestore.longDrafts),
        dataToRestore.sections.length > 0 && db.sections.bulkPut(dataToRestore.sections),
        dataToRestore.academicPapers.length > 0 && db.academicPapers.bulkPut(dataToRestore.academicPapers),
        dataToRestore.academicSections.length > 0 && db.academicSections.bulkPut(dataToRestore.academicSections),
        dataToRestore.bibliographyEntries.length > 0 && db.bibliographyEntries.bulkPut(dataToRestore.bibliographyEntries),
        dataToRestore.citations.length > 0 && db.citations.bulkPut(dataToRestore.citations),
        dataToRestore.figures.length > 0 && db.figures.bulkPut(dataToRestore.figures),
        dataToRestore.settings.length > 0 && db.settings.bulkPut(dataToRestore.settings),
        dataToRestore.lockedContent.length > 0 && db.lockedContent.bulkPut(dataToRestore.lockedContent),
      ]);
    });
  } catch (error) {
    return {
      success: false,
      error: `Failed to restore backup data: ${getErrorMessage(error, 'Unknown restore error')}`,
    };
  }

  return {
    success: true,
    recordsRestored: backup.metadata.totalRecords,
    tablesRestored: backup.metadata.tableCount,
  };
}

/**
 * Load and restore backup from file using Electron API
 */
export async function loadBackupFromFile(): Promise<RestoreResult> {
  try {
    let jsonString: string | null = null;

    if (window.electronAPI?.loadBackup) {
      jsonString = await window.electronAPI.loadBackup();
    } else {
      // Fallback for web: use file input
      jsonString = await new Promise<string | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsText(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }

    if (!jsonString) {
      return { success: false, error: 'No backup file selected' };
    }

    if (typeof jsonString !== 'string') {
      return { success: false, error: 'Backup file could not be read' };
    }

    const backup = parseBackupJSON(jsonString);
    return restoreBackup(backup);
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, 'Failed to load backup file'),
    };
  }
}

// ============================================================================
// Auto-Backup
// ============================================================================

let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get interval in milliseconds for backup frequency
 */
function getBackupIntervalMs(frequency: AutoBackupConfig['frequency']): number {
  switch (frequency) {
    case 'hourly':
      return 60 * 60 * 1000; // 1 hour
    case 'daily':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return 24 * 60 * 60 * 1000; // Default to daily
  }
}

/**
 * Perform auto-backup to configured location
 */
export async function performAutoBackup(location: string, maxBackups = 10): Promise<BackupResult> {
  try {
    const backup = await createBackup();
    const jsonString = backupToJSON(backup);

    if (window.electronAPI?.saveBackup) {
      // Save directly to configured location for auto-backups
      const filePath = await window.electronAPI.saveBackup(jsonString, location, maxBackups);
      if (filePath) {
        return {
          success: true,
          filePath,
          recordCount: backup.metadata.totalRecords,
        };
      }
    }

    return { success: false, error: 'Auto-backup requires Electron environment' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Auto-backup failed',
    };
  }
}

/**
 * Start auto-backup scheduler
 */
export function startAutoBackup(
  config: AutoBackupConfig,
  onBackupComplete?: (result: BackupResult) => void
): void {
  // Stop existing interval if running
  stopAutoBackup();

  if (!config.enabled || !config.location) {
    return;
  }

  const intervalMs = getBackupIntervalMs(config.frequency);

  autoBackupInterval = setInterval(async () => {
    const result = await performAutoBackup(config.location, config.maxBackups);
    onBackupComplete?.(result);
  }, intervalMs);

  // Also perform an immediate backup if last backup is old
  if (config.lastBackup) {
    const lastBackupTime = new Date(config.lastBackup).getTime();
    const now = Date.now();
    if (now - lastBackupTime > intervalMs) {
      performAutoBackup(config.location, config.maxBackups).then(onBackupComplete);
    }
  }
}

/**
 * Stop auto-backup scheduler
 */
export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
}

/**
 * Check if auto-backup is currently running
 */
export function isAutoBackupRunning(): boolean {
  return autoBackupInterval !== null;
}

// ============================================================================
// Backup Statistics
// ============================================================================

/**
 * Get statistics about current database
 */
export async function getBackupStats(): Promise<{
  tables: { name: string; count: number }[];
  totalRecords: number;
  estimatedSize: string;
}> {
  const counts = await Promise.all([
    db.scratchpadPages.count(),
    db.textBlocks.count(),
    db.blackboardCanvases.count(),
    db.canvasElements.count(),
    db.diaryEntries.count(),
    db.drafts.count(),
    db.longDrafts.count(),
    db.sections.count(),
    db.academicPapers.count(),
    db.academicSections.count(),
    db.bibliographyEntries.count(),
    db.citations.count(),
    db.figures.count(),
    db.settings.count(),
    db.lockedContent.count(),
  ]);

  const tableNames = [
    'Scratchpad Pages',
    'Text Blocks',
    'Blackboard Canvases',
    'Canvas Elements',
    'Diary Entries',
    'Drafts',
    'Long Drafts',
    'Sections',
    'Academic Papers',
    'Academic Sections',
    'Bibliography Entries',
    'Citations',
    'Figures',
    'Settings',
    'Locked Content',
  ];

  const tables = tableNames.map((name, i) => ({ name, count: counts[i] }));
  const totalRecords = counts.reduce((sum, count) => sum + count, 0);

  // Rough estimate: ~500 bytes per record average
  const estimatedBytes = totalRecords * 500;
  const estimatedSize =
    estimatedBytes < 1024
      ? `${estimatedBytes} B`
      : estimatedBytes < 1024 * 1024
        ? `${(estimatedBytes / 1024).toFixed(1)} KB`
        : `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;

  return { tables, totalRecords, estimatedSize };
}
