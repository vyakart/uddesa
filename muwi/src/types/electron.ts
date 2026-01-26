// TypeScript declarations for Electron API exposed via preload
export type Platform = 'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32';

export interface ElectronAPI {
  selectBackupLocation: () => Promise<string | undefined>;
  saveBackup: (backup: string, location?: string) => Promise<string | null>;
  loadBackup: () => Promise<string | null>;
  exportFile: (content: Uint8Array, defaultName: string) => Promise<string | null>;
  platform: Platform;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
