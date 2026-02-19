import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button, Input, Select, Toggle } from '@/components/common';

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

  const global = useSettingsStore((state) => state.global);
  const updateTheme = useSettingsStore((state) => state.updateTheme);
  const updateAccentColor = useSettingsStore((state) => state.updateAccentColor);
  const updateShelfLayout = useSettingsStore((state) => state.updateShelfLayout);
  const updateBackupSettings = useSettingsStore((state) => state.updateBackupSettings);
  const setPasskey = useSettingsStore((state) => state.setPasskey);
  const clearPasskey = useSettingsStore((state) => state.clearPasskey);

  const panelTitle = `${activeTab[0].toUpperCase()}${activeTab.slice(1)} Settings`;
  const tabPanelId = `settings-panel-${activeTab}`;

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
            onClick={() => setActiveTab(tab.id)}
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
              <li>Home shelf: Ctrl/Cmd + H</li>
              <li>Open settings: Ctrl/Cmd + ,</li>
              <li>Close current panel: Esc</li>
              <li>Save in editors: Ctrl/Cmd + S</li>
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
                    const location = await window.electronAPI?.selectBackupLocation?.();
                    if (location) {
                      await updateBackupSettings(
                        global.autoBackupEnabled,
                        global.autoBackupFrequency,
                        location
                      );
                    }
                  }}
                >
                  Choose
                </Button>
              </div>
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
              onChange={(event) => setPasskeyInput(event.target.value)}
            />

            <Input
              label="Passkey Hint"
              aria-label="Passkey Hint"
              value={passkeyHint}
              onChange={(event) => setPasskeyHint(event.target.value)}
            />

            <div className="muwi-settings__actions">
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  const nextPasskey = passkey.trim();
                  if (!nextPasskey) {
                    return;
                  }
                  await setPasskey(nextPasskey, passkeyHint.trim() || undefined);
                  setPasskeyInput('');
                  setPasskeyHint('');
                }}
              >
                Save Passkey
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void clearPasskey()}>
                Clear Passkey
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
