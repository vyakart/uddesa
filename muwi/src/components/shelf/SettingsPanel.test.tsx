import { fireEvent, render, screen, waitFor } from '@/test';
import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('supports tabbed navigation sections', () => {
    render(<SettingsPanel />);

    expect(screen.getByRole('tab', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Shortcuts' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Backup' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Privacy' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Shortcuts' }));
    expect(screen.getByRole('tabpanel', { name: 'Shortcuts' })).toBeInTheDocument();
    expect(screen.getByText(/Core keyboard shortcuts/i)).toBeInTheDocument();
  });

  it('supports arrow-key navigation between settings tabs', async () => {
    render(<SettingsPanel />);

    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' });
    appearanceTab.focus();
    fireEvent.keyDown(appearanceTab, { key: 'ArrowRight' });

    const shortcutsTab = screen.getByRole('tab', { name: 'Shortcuts' });
    await waitFor(() => {
      expect(shortcutsTab).toHaveFocus();
      expect(shortcutsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('updates appearance and backup settings', async () => {
    render(<SettingsPanel />);

    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('system');

    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), {
      target: { value: 'dark' },
    });
    fireEvent.change(screen.getByLabelText('Accent Color'), {
      target: { value: '#112233' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Shelf Layout' }), {
      target: { value: 'list' },
    });

    await waitFor(() => {
      const global = useSettingsStore.getState().global;
      expect(global.theme).toBe('dark');
      expect(global.accentColor).toBe('#112233');
      expect(global.shelfLayout).toBe('list');
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), {
      target: { value: 'system' },
    });

    await waitFor(() => {
      expect(useSettingsStore.getState().global.theme).toBe('system');
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Backup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose' }));

    await waitFor(() => {
      expect(useSettingsStore.getState().global.backupLocation).toBe('/mock/backup/path');
    });
  });

  it('supports passkey set and clear actions', async () => {
    render(<SettingsPanel />);

    fireEvent.click(screen.getByRole('tab', { name: 'Privacy' }));
    fireEvent.change(screen.getByLabelText('Set Passkey'), {
      target: { value: 'my-secret' },
    });
    fireEvent.change(screen.getByLabelText('Passkey Hint'), {
      target: { value: 'testing-hint' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Passkey' }));

    await waitFor(() => {
      const global = useSettingsStore.getState().global;
      expect(global.passkeyHash).toBeDefined();
      expect(global.passkeyHash).not.toBe('my-secret');
      expect(global.passkeySalt).toBeDefined();
      expect(global.passkeyHint).toBe('testing-hint');
    });

    await expect(useSettingsStore.getState().verifyPasskey('my-secret')).resolves.toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Passkey' }));
    await waitFor(() => {
      const global = useSettingsStore.getState().global;
      expect(global.passkeyHash).toBeUndefined();
      expect(global.passkeySalt).toBeUndefined();
      expect(global.passkeyHint).toBeUndefined();
    });
  });
});
