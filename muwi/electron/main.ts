import electron from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const { app, BrowserWindow, ipcMain, dialog } = electron;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindowType | null = null;
const AUTO_BACKUP_FILE_PATTERN = /^muwi-backup-(\d+)\.json$/;
const MIN_BACKUP_RETENTION = 1;
const MAX_BACKUP_RETENTION = 100;
const DEFAULT_BACKUP_RETENTION = 10;
const MAX_BACKUP_BYTES = 100 * 1024 * 1024;
const MAX_EXPORT_BYTES = 100 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 160;
const ALLOWED_EXPORT_EXTENSIONS = new Set(['.pdf', '.docx', '.tex']);

function clampBackupRetention(rawValue: unknown): number {
  if (!Number.isFinite(rawValue)) {
    return DEFAULT_BACKUP_RETENTION;
  }

  const value = Math.floor(Number(rawValue));
  return Math.min(MAX_BACKUP_RETENTION, Math.max(MIN_BACKUP_RETENTION, value));
}

function normalizeBackupPayload(rawBackup: unknown): string {
  if (typeof rawBackup !== 'string') {
    throw new Error('Invalid backup payload');
  }

  if (Buffer.byteLength(rawBackup, 'utf8') > MAX_BACKUP_BYTES) {
    throw new Error('Backup payload exceeds size limit');
  }

  return rawBackup;
}

async function normalizeDirectoryPath(rawLocation: unknown): Promise<string | undefined> {
  if (rawLocation == null) {
    return undefined;
  }

  if (typeof rawLocation !== 'string') {
    throw new Error('Invalid backup location');
  }

  const trimmed = rawLocation.trim();
  if (!trimmed) {
    throw new Error('Invalid backup location');
  }

  const resolved = path.resolve(trimmed);
  const stats = await fs.stat(resolved).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error('Backup location must be an existing directory');
  }

  return resolved;
}

function normalizeExportFilename(rawFilename: unknown): string {
  if (typeof rawFilename !== 'string') {
    throw new Error('Invalid export filename');
  }

  const trimmed = rawFilename.trim();
  if (!trimmed || trimmed.length > MAX_FILENAME_LENGTH || trimmed.includes('\0')) {
    throw new Error('Invalid export filename');
  }

  const baseName = path.basename(trimmed);
  const extension = path.extname(baseName).toLowerCase();

  if (!baseName || baseName === '.' || baseName === '..') {
    throw new Error('Invalid export filename');
  }

  if (!ALLOWED_EXPORT_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported export file type');
  }

  return baseName;
}

function normalizeExportContent(rawContent: unknown): Uint8Array {
  if (rawContent instanceof Uint8Array) {
    if (rawContent.byteLength > MAX_EXPORT_BYTES) {
      throw new Error('Export content exceeds size limit');
    }
    return rawContent;
  }

  if (rawContent instanceof ArrayBuffer) {
    const bytes = new Uint8Array(rawContent);
    if (bytes.byteLength > MAX_EXPORT_BYTES) {
      throw new Error('Export content exceeds size limit');
    }
    return bytes;
  }

  if (ArrayBuffer.isView(rawContent)) {
    const bytes = new Uint8Array(rawContent.buffer, rawContent.byteOffset, rawContent.byteLength);
    if (bytes.byteLength > MAX_EXPORT_BYTES) {
      throw new Error('Export content exceeds size limit');
    }
    return bytes;
  }

  throw new Error('Invalid export content');
}

function isAllowedNavigationUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'file:') {
      return true;
    }

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (!devServerUrl) {
      return false;
    }

    return url.origin === new URL(devServerUrl).origin;
  } catch {
    return false;
  }
}

function configureWindowSecurity(window: BrowserWindowType): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedNavigationUrl(navigationUrl)) {
      event.preventDefault();
    }
  });
}

async function cleanupOldAutoBackups(location: string, maxBackups: number): Promise<void> {
  if (!Number.isFinite(maxBackups) || maxBackups <= 0) {
    return;
  }

  const entries = await fs.readdir(location, { withFileTypes: true });
  const backupFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const match = entry.name.match(AUTO_BACKUP_FILE_PATTERN);
      if (!match) return null;
      return {
        name: entry.name,
        timestamp: Number(match[1]),
      };
    })
    .filter((item): item is { name: string; timestamp: number } => item !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  const staleFiles = backupFiles.slice(maxBackups);
  await Promise.all(
    staleFiles.map((file) => fs.unlink(path.join(location, file.name)).catch(() => undefined))
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
  });
  configureWindowSecurity(mainWindow);

  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-backup-location', async () => {
  if (!mainWindow) return undefined;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return undefined;
  }

  const selectedPath = path.resolve(result.filePaths[0]);
  const stats = await fs.stat(selectedPath).catch(() => null);
  if (!stats?.isDirectory()) {
    return undefined;
  }

  return selectedPath;
});

ipcMain.handle('save-backup', async (_event, backup: string, location?: string, maxBackups = 10) => {
  if (!mainWindow) return null;
  const backupPayload = normalizeBackupPayload(backup);
  const normalizedLocation = await normalizeDirectoryPath(location);
  const normalizedMaxBackups = clampBackupRetention(maxBackups);

  let filepath: string;

  if (normalizedLocation) {
    // Auto-backup: save directly to location
    const filename = `muwi-backup-${Date.now()}.json`;
    filepath = path.join(normalizedLocation, filename);
  } else {
    // Manual backup: show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `muwi-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'MUWI Backup', extensions: ['json'] }],
    });
    if (!result.filePath) return null;
    filepath = result.filePath;
  }

  await fs.writeFile(filepath, backupPayload, { encoding: 'utf8' });

  if (normalizedLocation) {
    await cleanupOldAutoBackups(normalizedLocation, normalizedMaxBackups);
  }

  return filepath;
});

ipcMain.handle('load-backup', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'MUWI Backup', extensions: ['json'] }],
  });

  if (result.filePaths.length === 0) return null;

  const content = await fs.readFile(result.filePaths[0], 'utf-8');
  return content;
});

ipcMain.handle('export-file', async (_event, content: Uint8Array, defaultName: string) => {
  if (!mainWindow) return null;
  const exportContent = normalizeExportContent(content);
  const exportFilename = normalizeExportFilename(defaultName);

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: exportFilename,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'LaTeX', extensions: ['tex'] },
    ],
  });

  if (result.filePath) {
    await fs.writeFile(result.filePath, Buffer.from(exportContent));
    return result.filePath;
  }
  return null;
});
