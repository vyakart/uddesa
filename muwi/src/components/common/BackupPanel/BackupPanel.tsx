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

  // Load stats on open
  useEffect(() => {
    if (isOpen) {
      getBackupStats().then(setStats);
      setLocalAutoEnabled(autoBackupEnabled);
      setLocalFrequency(autoBackupFrequency);
      setLocalLocation(backupLocation);
    }
  }, [isOpen, autoBackupEnabled, autoBackupFrequency, backupLocation]);

  const handleBackup = useCallback(async () => {
    setIsBackingUp(true);
    setMessage(null);

    try {
      const result: BackupResult = await saveBackupToFile();

      if (result.success) {
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
        // Refresh stats
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
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    onSettingsChange?.({
      autoBackupEnabled: localAutoEnabled,
      autoBackupFrequency: localFrequency,
      backupLocation: localLocation,
    });

    // Update auto-backup scheduler
    if (localAutoEnabled && localLocation) {
      startAutoBackup({
        enabled: true,
        frequency: localFrequency,
        location: localLocation,
        maxBackups: 10,
        lastBackup,
      });
    } else {
      stopAutoBackup();
    }

    setMessage({ type: 'success', text: 'Settings saved' });
  }, [localAutoEnabled, localFrequency, localLocation, lastBackup, onSettingsChange]);

  const formatLastBackup = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '520px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
            Backup & Restore
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Database stats */}
          {stats && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Database Overview
                </span>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                  Est. size: {stats.estimatedSize}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                }}
              >
                {stats.tables
                  .filter((t) => t.count > 0)
                  .slice(0, 6)
                  .map((table) => (
                    <div
                      key={table.name}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{table.name}</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                        {table.count}
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280' }}>
                Total: {stats.totalRecords} records
              </div>
            </div>
          )}

          {/* Manual backup/restore */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Manual Backup
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleBackup}
                disabled={isBackingUp}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: isBackingUp ? '#9CA3AF' : '#4A90A4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isBackingUp ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
              </button>
              <button
                onClick={() => setShowConfirmRestore(true)}
                disabled={isRestoring}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: 'white',
                  color: isRestoring ? '#9CA3AF' : '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isRestoring ? 'Restoring...' : 'Restore Backup'}
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
              Last backup: {formatLastBackup(lastBackup)}
            </div>
          </div>

          {/* Auto-backup settings */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Automatic Backup
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              <input
                type="checkbox"
                checked={localAutoEnabled}
                onChange={(e) => setLocalAutoEnabled(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Enable automatic backups</span>
              {isAutoBackupRunning() && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    backgroundColor: '#D1FAE5',
                    color: '#059669',
                    borderRadius: '4px',
                  }}
                >
                  Active
                </span>
              )}
            </label>

            {localAutoEnabled && (
              <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6B7280',
                      marginBottom: '6px',
                    }}
                  >
                    Frequency
                  </label>
                  <select
                    value={localFrequency}
                    onChange={(e) => setLocalFrequency(e.target.value as 'hourly' | 'daily' | 'weekly')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="hourly">Every hour</option>
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#6B7280',
                      marginBottom: '6px',
                    }}
                  >
                    Backup Location
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={localLocation}
                      readOnly
                      placeholder="Select a folder..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: '#F9FAFB',
                        color: '#6B7280',
                      }}
                    />
                    <button
                      onClick={handleSelectLocation}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Browse
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    backgroundColor: '#4A90A4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                borderRadius: '8px',
                color: message.type === 'success' ? '#16A34A' : '#DC2626',
                fontSize: '14px',
              }}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A90A4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirm restore modal */}
      {showConfirmRestore && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  color: '#D97706',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                  Restore Backup?
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                  This will replace all current data with the backup. This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmRestore(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
