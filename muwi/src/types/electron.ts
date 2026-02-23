// TypeScript declarations for Electron API exposed via preload
export type Platform = 'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32';

export interface ElectronAPI {
  /**
   * Opens a system picker and resolves with a directory path or `undefined` when canceled.
   */
  selectBackupLocation: () => Promise<string | undefined>;
  /**
   * Persists backup payload. Promise may reject when payload/arguments fail runtime validation.
   */
  saveBackup: (backup: string, location?: string, maxBackups?: number) => Promise<string | null>;
  /**
   * Opens a backup file and resolves with its raw JSON contents.
   */
  loadBackup: () => Promise<string | null>;
  /**
   * Saves generated export content. Promise may reject when arguments fail runtime validation.
   */
  exportFile: (content: Uint8Array, defaultName: string) => Promise<string | null>;
  readonly platform: Platform;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
