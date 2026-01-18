import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Backup operations
  selectBackupLocation: () => ipcRenderer.invoke('select-backup-location'),
  saveBackup: (backup: string, location: string) =>
    ipcRenderer.invoke('save-backup', backup, location),
  loadBackup: () => ipcRenderer.invoke('load-backup'),

  // Export operations
  exportFile: (content: Uint8Array, defaultName: string) =>
    ipcRenderer.invoke('export-file', content, defaultName),

  // Platform detection
  platform: process.platform,
});
