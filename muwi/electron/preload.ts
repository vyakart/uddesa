import { contextBridge, ipcRenderer } from 'electron';

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
}

function assertOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string when provided`);
  }

  return value;
}

function assertOptionalFiniteNumber(value: unknown, fieldName: string): number | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number when provided`);
  }

  return value;
}

function assertUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  throw new Error('content must be binary data');
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = Object.freeze({
  // Backup operations
  selectBackupLocation: () => ipcRenderer.invoke('select-backup-location'),
  saveBackup: (backup: string, location?: string, maxBackups?: number) =>
    ipcRenderer.invoke(
      'save-backup',
      assertString(backup, 'backup'),
      assertOptionalString(location, 'location'),
      assertOptionalFiniteNumber(maxBackups, 'maxBackups')
    ),
  loadBackup: () => ipcRenderer.invoke('load-backup'),

  // Export operations
  exportFile: (content: Uint8Array, defaultName: string) =>
    ipcRenderer.invoke('export-file', assertUint8Array(content), assertString(defaultName, 'defaultName')),

  // Platform detection
  platform: process.platform,
});

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
