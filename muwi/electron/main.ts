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
  return result.filePaths[0];
});

ipcMain.handle('save-backup', async (_event, backup: string, location?: string, maxBackups = 10) => {
  if (!mainWindow) return null;

  let filepath: string;

  if (location) {
    // Auto-backup: save directly to location
    const filename = `muwi-backup-${Date.now()}.json`;
    filepath = path.join(location, filename);
  } else {
    // Manual backup: show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `muwi-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'MUWI Backup', extensions: ['json'] }],
    });
    if (!result.filePath) return null;
    filepath = result.filePath;
  }

  await fs.writeFile(filepath, backup);

  if (location) {
    await cleanupOldAutoBackups(location, maxBackups);
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
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'LaTeX', extensions: ['tex'] },
    ],
  });

  if (result.filePath) {
    await fs.writeFile(result.filePath, Buffer.from(content));
    return result.filePath;
  }
  return null;
});
