import { useState, useEffect, useCallback } from 'react';
import {
  saveBackupToFile,
  loadBackupFromFile,
  getBackupStats,
  startAutoBackup,
  stopAutoBackup,
  isAutoBackupRunning,
  type BackupResult,
  type RestoreResult,
} from '@/utils/backup';
import { Modal } from '../Modal';
import { Button } from '../Button';

interface BackupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  autoBackupEnabled?: boolean;
  autoBackupFrequency?: 'hourly' | 'daily' | 'weekly';
  backupLocation?: string;
  lastBackup?: string;
  onSettingsChange?: (settings: {
    autoBackupEnabled: boolean;
    autoBackupFrequency: 'hourly' | 'daily' | 'weekly';
    backupLocation: string;
  }) => void;
}

interface BackupStats {
  tables: { name: string; count: number }[];
  totalRecords: number;
  estimatedSize: string;
}

export function BackupPanel({
  isOpen,
  onClose,
  autoBackupEnabled = false,
  autoBackupFrequency = 'daily',
  backupLocation = '',
  lastBackup,
  onSettingsChange,
}: BackupPanelProps) {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [localAutoEnabled, setLocalAutoEnabled] = useState(autoBackupEnabled);
  const [localFrequency, setLocalFrequency] = useState(autoBackupFrequency);
  const [localLocation, setLocalLocation] = useState(backupLocation);
  const [localLastBackup, setLocalLastBackup] = useState(lastBackup);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    getBackupStats().then(setStats);
    setLocalAutoEnabled(autoBackupEnabled);
    setLocalFrequency(autoBackupFrequency);
    setLocalLocation(backupLocation);
    setLocalLastBackup(lastBackup);
  }, [isOpen, autoBackupEnabled, autoBackupFrequency, backupLocation, lastBackup]);

  const handleBackup = useCallback(async () => {
    setIsBackingUp(true);
    setMessage(null);

    try {
      const result: BackupResult = await saveBackupToFile();

      if (result.success) {
        setLocalLastBackup(new Date().toISOString());
        setMessage({
          type: 'success',
          text: `Backup created successfully! (${result.recordCount} records)`,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Backup failed' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Backup failed',
      });
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    setShowConfirmRestore(false);
    setIsRestoring(true);
    setMessage(null);

    try {
      const result: RestoreResult = await loadBackupFromFile();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Restored ${result.recordsRestored} records from ${result.tablesRestored} tables. Refresh to see changes.`,
        });
        const newStats = await getBackupStats();
        setStats(newStats);
      } else {
        setMessage({ type: 'error', text: result.error || 'Restore failed' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Restore failed',
      });
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const handleSelectLocation = useCallback(async () => {
    if (window.electronAPI?.selectBackupLocation) {
      const location = await window.electronAPI.selectBackupLocation();
      if (location) {
        setLocalLocation(location);
      }
      return;
    }

    setMessage({
      type: 'error',
      text: 'Location picker requires the desktop app.',
    });
  }, []);

  const handleSaveSettings = useCallback(() => {
    const normalizedLocation = localLocation.trim();
    if (localAutoEnabled && !normalizedLocation) {
      setMessage({
        type: 'error',
        text: 'Select a backup location to enable automatic backups.',
      });
      return;
    }

    onSettingsChange?.({
      autoBackupEnabled: localAutoEnabled,
      autoBackupFrequency: localFrequency,
      backupLocation: normalizedLocation,
    });

    if (localAutoEnabled && normalizedLocation) {
      startAutoBackup(
        {
          enabled: true,
          frequency: localFrequency,
          location: normalizedLocation,
          maxBackups: 10,
          lastBackup: localLastBackup,
        },
        (result) => {
          if (result.success) {
            setLocalLastBackup(new Date().toISOString());
            setMessage({
              type: 'success',
              text: `Auto-backup completed${result.recordCount ? ` (${result.recordCount} records)` : ''}.`,
            });
          } else {
            setMessage({
              type: 'error',
              text: result.error || 'Auto-backup failed',
            });
          }
        }
      );
    } else {
      stopAutoBackup();
    }

    setMessage({ type: 'success', text: 'Settings saved' });
  }, [localAutoEnabled, localFrequency, localLocation, localLastBackup, onSettingsChange]);

  const formatLastBackup = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Backup & Restore"
        maxWidth={520}
        className="muwi-backup-modal"
      >
        <div className="muwi-backup-panel">
          <div className="muwi-backup-panel__content">
            {stats ? (
              <section className="muwi-backup-panel__section muwi-backup-panel__overview">
                <div className="muwi-backup-panel__overview-header">
                  <span className="muwi-backup-panel__overview-title">Database Overview</span>
                  <span className="muwi-backup-panel__overview-size">Est. size: {stats.estimatedSize}</span>
                </div>
                <div className="muwi-backup-panel__table-grid">
                  {stats.tables
                    .filter((table) => table.count > 0)
                    .slice(0, 6)
                    .map((table) => (
                      <div key={table.name} className="muwi-backup-panel__table-card">
                        <div className="muwi-backup-panel__table-name">{table.name}</div>
                        <div className="muwi-backup-panel__table-count">{table.count}</div>
                      </div>
                    ))}
                </div>
                <div className="muwi-backup-panel__total">Total: {stats.totalRecords} records</div>
              </section>
            ) : null}

            <section className="muwi-backup-panel__section">
              <p className="muwi-backup-panel__label">Manual Backup</p>
              <div className="muwi-backup-panel__button-row">
                <Button type="button" onClick={handleBackup} disabled={isBackingUp} variant="primary" size="md" fullWidth>
                  {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowConfirmRestore(true)}
                  disabled={isRestoring}
                  variant="secondary"
                  size="md"
                  fullWidth
                >
                  {isRestoring ? 'Restoring...' : 'Restore Backup'}
                </Button>
              </div>
              <p className="muwi-backup-panel__last">Last backup: {formatLastBackup(localLastBackup)}</p>
            </section>

            <section className="muwi-backup-panel__section">
              <p className="muwi-backup-panel__label">Automatic Backup</p>

              <label className="muwi-backup-panel__checkbox-row">
                <input
                  type="checkbox"
                  checked={localAutoEnabled}
                  onChange={(event) => setLocalAutoEnabled(event.target.checked)}
                />
                <span>Enable automatic backups</span>
                {isAutoBackupRunning() ? <span className="muwi-backup-panel__active-badge">Active</span> : null}
              </label>

              {localAutoEnabled ? (
                <div className="muwi-backup-panel__auto-settings">
                  <div className="muwi-field">
                    <label htmlFor="backup-frequency" className="muwi-field__label">Frequency</label>
                    <select
                      id="backup-frequency"
                      value={localFrequency}
                      onChange={(event) => setLocalFrequency(event.target.value as 'hourly' | 'daily' | 'weekly')}
                      className="muwi-form-control"
                    >
                      <option value="hourly">Every hour</option>
                      <option value="daily">Every day</option>
                      <option value="weekly">Every week</option>
                    </select>
                  </div>

                  <div className="muwi-field">
                    <label htmlFor="backup-location" className="muwi-field__label">Backup Location</label>
                    <div className="muwi-backup-panel__location-row">
                      <input
                        id="backup-location"
                        type="text"
                        value={localLocation}
                        readOnly
                        placeholder="Select a folder..."
                        className="muwi-form-control"
                      />
                      <Button type="button" onClick={handleSelectLocation} variant="secondary" size="md">
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Button type="button" onClick={handleSaveSettings} variant="primary" size="md">
                      Save Settings
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            {message ? (
              <div className="muwi-backup-panel__message" data-variant={message.type === 'success' ? 'success' : 'error'}>
                {message.text}
              </div>
            ) : null}
          </div>

          <footer className="muwi-backup-panel__footer">
            <Button type="button" onClick={onClose} variant="primary" size="md">
              Done
            </Button>
          </footer>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmRestore}
        onClose={() => setShowConfirmRestore(false)}
        title="Restore Backup?"
        maxWidth={400}
        className="muwi-backup-confirm-modal"
      >
        <div className="muwi-backup-confirm">
          <p className="muwi-backup-confirm__text">
            This will replace all current data with the backup. This action cannot be undone.
          </p>
          <div className="muwi-backup-confirm__actions">
            <Button type="button" onClick={() => setShowConfirmRestore(false)} variant="secondary" size="md">
              Cancel
            </Button>
            <Button type="button" onClick={handleRestore} variant="danger" size="md">
              Restore
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
