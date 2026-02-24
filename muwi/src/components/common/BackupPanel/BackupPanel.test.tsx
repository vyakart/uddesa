import { act, fireEvent, render, screen, waitFor } from '@/test';
import { BackupPanel } from './BackupPanel';
import {
  getBackupStats,
  isAutoBackupRunning,
  loadBackupFromFile,
  saveBackupToFile,
  startAutoBackup,
  stopAutoBackup,
} from '@/utils/backup';

vi.mock('@/utils/backup', () => ({
  saveBackupToFile: vi.fn(),
  loadBackupFromFile: vi.fn(),
  getBackupStats: vi.fn(),
  startAutoBackup: vi.fn(),
  stopAutoBackup: vi.fn(),
  isAutoBackupRunning: vi.fn(),
}));

describe('BackupPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAutoBackupRunning).mockReturnValue(false);
    vi.mocked(getBackupStats).mockResolvedValue({
      tables: [
        { name: 'drafts', count: 3 },
        { name: 'scratchpad', count: 0 },
        { name: 'academic', count: 2 },
      ],
      totalRecords: 5,
      estimatedSize: '24 KB',
    });
  });

  it('does not render when closed and loads stats when opened', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<BackupPanel isOpen={false} onClose={onClose} />);

    expect(screen.queryByText('Backup & Restore')).not.toBeInTheDocument();

    rerender(<BackupPanel isOpen onClose={onClose} />);

    await waitFor(() => {
      expect(getBackupStats).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Database Overview')).toBeInTheDocument();
    });

    expect(screen.getByText('drafts')).toBeInTheDocument();
    expect(screen.queryByText('scratchpad')).not.toBeInTheDocument();
    expect(screen.getByText('Total: 5 records')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('runs backup and restore flows, updates last backup timestamp, and refreshes stats after restore', async () => {
    vi.mocked(saveBackupToFile).mockResolvedValue({ success: true, recordCount: 12 });
    vi.mocked(loadBackupFromFile).mockResolvedValue({
      success: true,
      recordsRestored: 4,
      tablesRestored: 2,
    });
    vi.mocked(getBackupStats)
      .mockResolvedValueOnce({
        tables: [{ name: 'drafts', count: 5 }],
        totalRecords: 5,
        estimatedSize: '24 KB',
      })
      .mockResolvedValueOnce({
        tables: [{ name: 'drafts', count: 9 }],
        totalRecords: 9,
        estimatedSize: '40 KB',
      });

    render(<BackupPanel isOpen onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Total: 5 records')).toBeInTheDocument();
    });
    expect(screen.getByText('Last backup: Never')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create Backup' }));
    await waitFor(() => {
      expect(saveBackupToFile).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Backup created successfully! (12 records)')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Backup created successfully! (12 records)');
    });
    expect(screen.queryByText('Last backup: Never')).not.toBeInTheDocument();
    expect(screen.getByText(/^Last backup:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restore Backup' }));
    expect(screen.getByText('Restore Backup?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(loadBackupFromFile).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Restored 4 records from 2 tables. Refresh to see changes.')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Restored 4 records from 2 tables. Refresh to see changes.'
      );
      expect(getBackupStats).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Total: 9 records')).toBeInTheDocument();
    });
  });

  it('saves auto-backup settings and handles scheduler start/stop conditions', async () => {
    const onSettingsChange = vi.fn();
    vi.mocked(isAutoBackupRunning).mockReturnValue(true);
    window.electronAPI.selectBackupLocation = vi.fn().mockResolvedValue('/chosen/backups  ');

    render(
      <BackupPanel
        isOpen
        onClose={vi.fn()}
        autoBackupEnabled={false}
        autoBackupFrequency="daily"
        backupLocation=""
        lastBackup="2026-02-11T09:30:00.000Z"
        onSettingsChange={onSettingsChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Database Overview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByText('Select a backup location to enable automatic backups.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select a backup location to enable automatic backups.'
    );
    expect(onSettingsChange).not.toHaveBeenCalled();
    expect(stopAutoBackup).not.toHaveBeenCalled();
    expect(startAutoBackup).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'weekly' } });
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

    await waitFor(() => {
      expect(window.electronAPI.selectBackupLocation).toHaveBeenCalledTimes(1);
      expect(screen.getByPlaceholderText('Select a folder...')).toHaveValue('/chosen/backups  ');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(onSettingsChange).toHaveBeenCalledWith({
      autoBackupEnabled: true,
      autoBackupFrequency: 'weekly',
      backupLocation: '/chosen/backups',
    });
    expect(startAutoBackup).toHaveBeenCalledWith(
      {
        enabled: true,
        frequency: 'weekly',
        location: '/chosen/backups',
        maxBackups: 10,
        lastBackup: '2026-02-11T09:30:00.000Z',
      },
      expect.any(Function)
    );
    expect(screen.getByText('Settings saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved');

    const onBackupComplete = vi.mocked(startAutoBackup).mock.calls.at(-1)?.[1] as
      | ((result: { success: boolean; recordCount?: number; error?: string }) => void)
      | undefined;
    await act(async () => {
      onBackupComplete?.({ success: true, recordCount: 6 });
    });
    expect(screen.getByText('Auto-backup completed (6 records).')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Auto-backup completed (6 records).');

    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
