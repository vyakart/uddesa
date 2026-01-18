import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock window.electronAPI for tests running outside Electron
Object.defineProperty(window, 'electronAPI', {
  value: {
    selectBackupLocation: vi.fn().mockResolvedValue('/mock/backup/path'),
    saveBackup: vi.fn().mockResolvedValue('/mock/backup/file.json'),
    loadBackup: vi.fn().mockResolvedValue(null),
    exportFile: vi.fn().mockResolvedValue('/mock/export/file.pdf'),
    platform: 'darwin' as const,
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
