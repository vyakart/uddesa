import { useState, type KeyboardEvent } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/common/Button';
import { Input, Select, Toggle } from '@/components/common/FormControls';

type SettingsTab = 'appearance' | 'shortcuts' | 'backup' | 'privacy';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'backup', label: 'Backup' },
  { id: 'privacy', label: 'Privacy' },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [passkey, setPasskeyInput] = useState('');
  const [passkeyHint, setPasskeyHint] = useState('');
  const [backupLocationError, setBackupLocationError] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const global = useSettingsStore((state) => state.global);
  const updateTheme = useSettingsStore((state) => state.updateTheme);
  const updateAccentColor = useSettingsStore((state) => state.updateAccentColor);
  const updateShelfLayout = useSettingsStore((state) => state.updateShelfLayout);
  const updateBackupSettings = useSettingsStore((state) => state.updateBackupSettings);
  const setPasskey = useSettingsStore((state) => state.setPasskey);
  const clearPasskey = useSettingsStore((state) => state.clearPasskey);

  const panelTitle = `${activeTab[0].toUpperCase()}${activeTab.slice(1)} Settings`;
  const tabId = `settings-tab-${activeTab}`;
  const tabPanelId = `settings-panel-${activeTab}`;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex: number;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.id);
    requestAnimationFrame(() => {
      document.getElementById(`settings-tab-${nextTab.id}`)?.focus();
    });
  };

  return (
    <div className="muwi-settings">
      <div role="tablist" aria-label="Settings sections" className="muwi-settings__nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`settings-tab-${tab.id}`}
            aria-controls={`settings-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleTabKeyDown}
            className={['muwi-sidebar-item', 'muwi-settings__tab', activeTab === tab.id ? 'is-active' : null]
              .filter(Boolean)
              .join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={tabId}
        aria-label={panelTitle}
        className="muwi-settings__content"
      >
        {activeTab === 'appearance' ? (
          <>
            <Select
              label="Theme"
              value={global.theme}
              onChange={(event) => {
                void updateTheme(event.target.value as typeof global.theme);
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </Select>

            <div className="muwi-field">
              <label htmlFor="settings-accent-color" className="muwi-field__label">
                Accent Color
              </label>
              <input
                id="settings-accent-color"
                aria-label="Accent Color"
                type="color"
                className="muwi-form-control muwi-settings__color-input"
                value={global.accentColor}
                onChange={(event) => {
                  void updateAccentColor(event.target.value);
                }}
              />
            </div>

            <Select
              label="Shelf Layout"
              value={global.shelfLayout}
              onChange={(event) => {
                void updateShelfLayout(event.target.value as typeof global.shelfLayout);
              }}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="shelf">Shelf</option>
            </Select>
          </>
        ) : null}

        {activeTab === 'shortcuts' ? (
          <div className="muwi-settings__shortcut-copy">
            <p>Core keyboard shortcuts:</p>
            <ul>
              <li>Command palette: Ctrl/Cmd + K</li>
              <li>Settings: Ctrl/Cmd + ,</li>
              <li>Toggle sidebar: Ctrl/Cmd + B</li>
              <li>Switch diaries: Ctrl/Cmd + 1-6</li>
              <li>Go to shelf: Ctrl/Cmd + H</li>
              <li>Close active overlay / go back: Esc</li>
              <li>Editor formatting: Ctrl/Cmd + B, I, U, 1, 2, 3</li>
            </ul>
          </div>
        ) : null}

        {activeTab === 'backup' ? (
          <>
            <Toggle
              label="Enable automatic backups"
              checked={global.autoBackupEnabled}
              onChange={(event) => {
                void updateBackupSettings(
                  event.target.checked,
                  global.autoBackupFrequency,
                  global.backupLocation
                );
              }}
            />

            <Select
              label="Backup Frequency"
              value={global.autoBackupFrequency}
              onChange={(event) => {
                void updateBackupSettings(
                  global.autoBackupEnabled,
                  event.target.value as typeof global.autoBackupFrequency,
                  global.backupLocation
                );
              }}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>

            <div className="muwi-field">
              <label htmlFor="settings-backup-location" className="muwi-field__label">
                Backup Location
              </label>
              <div className="muwi-settings__backup-row">
                <input
                  id="settings-backup-location"
                  className="muwi-form-control"
                  readOnly
                  aria-label="Backup Location"
                  value={global.backupLocation}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    setBackupLocationError(null);
                    try {
                      const location = await window.electronAPI?.selectBackupLocation?.();
                      if (location) {
                        await updateBackupSettings(
                          global.autoBackupEnabled,
                          global.autoBackupFrequency,
                          location
                        );
                      }
                    } catch (error) {
                      setBackupLocationError(
                        error instanceof Error ? error.message : 'Failed to open location picker'
                      );
                    }
                  }}
                >
                  Choose
                </Button>
              </div>
              {backupLocationError ? (
                <p role="alert" className="muwi-field__help" style={{ color: 'var(--color-error)' }}>
                  {backupLocationError}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {activeTab === 'privacy' ? (
          <>
            <Input
              label="Set Passkey"
              aria-label="Set Passkey"
              type="password"
              value={passkey}
              onChange={(event) => {
                setPasskeyInput(event.target.value);
                if (passkeyError) {
                  setPasskeyError(null);
                }
              }}
            />

            <Input
              label="Passkey Hint"
              aria-label="Passkey Hint"
              value={passkeyHint}
              onChange={(event) => {
                setPasskeyHint(event.target.value);
                if (passkeyError) {
                  setPasskeyError(null);
                }
              }}
            />

            {passkeyError ? (
              <p role="alert" className="muwi-passkey-error">
                {passkeyError}
              </p>
            ) : null}

            <div className="muwi-settings__actions">
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  const nextPasskey = passkey.trim();
                  if (!nextPasskey) {
                    setPasskeyError('Passkey is required');
                    return;
                  }
                  setPasskeyError(null);
                  await setPasskey(nextPasskey, passkeyHint.trim() || undefined);
                  setPasskeyInput('');
                  setPasskeyHint('');
                }}
              >
                Save Passkey
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setPasskeyError(null);
                  void clearPasskey();
                }}
              >
                Clear Passkey
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
