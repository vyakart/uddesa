import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

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

  return (
    <div>
      <div role="tablist" aria-label="Settings sections" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              border: activeTab === tab.id ? '1px solid #4A90A4' : '1px solid #d7d7d7',
              borderRadius: 8,
              padding: '0.45rem 0.75rem',
              background: activeTab === tab.id ? '#e8f4f7' : '#fafafa',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={panelTitle} style={{ display: 'grid', gap: 12 }}>
        {activeTab === 'appearance' ? (
          <>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Theme</span>
              <select
                value={global.theme}
                onChange={(event) => {
                  void updateTheme(event.target.value as typeof global.theme);
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <span>Accent Color</span>
              <input
                aria-label="Accent Color"
                type="color"
                value={global.accentColor}
                onChange={(event) => {
                  void updateAccentColor(event.target.value);
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <span>Shelf Layout</span>
              <select
                value={global.shelfLayout}
                onChange={(event) => {
                  void updateShelfLayout(event.target.value as typeof global.shelfLayout);
                }}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="shelf">Shelf</option>
              </select>
            </label>
          </>
        ) : null}

        {activeTab === 'shortcuts' ? (
          <div>
            <p style={{ marginTop: 0 }}>Core keyboard shortcuts:</p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>Home shelf: Ctrl/Cmd + H</li>
              <li>Open settings: Ctrl/Cmd + ,</li>
              <li>Close current panel: Esc</li>
              <li>Save in editors: Ctrl/Cmd + S</li>
            </ul>
          </div>
        ) : null}

        {activeTab === 'backup' ? (
          <>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={global.autoBackupEnabled}
                onChange={(event) => {
                  void updateBackupSettings(
                    event.target.checked,
                    global.autoBackupFrequency,
                    global.backupLocation
                  );
                }}
              />
              Enable automatic backups
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <span>Backup Frequency</span>
              <select
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
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>Backup Location</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly aria-label="Backup Location" value={global.backupLocation} style={{ flex: 1 }} />
                <button
                  type="button"
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
                </button>
              </div>
            </label>
          </>
        ) : null}

        {activeTab === 'privacy' ? (
          <>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Set Passkey</span>
              <input
                aria-label="Set Passkey"
                type="password"
                value={passkey}
                onChange={(event) => setPasskeyInput(event.target.value)}
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <span>Passkey Hint</span>
              <input
                aria-label="Passkey Hint"
                value={passkeyHint}
                onChange={(event) => setPasskeyHint(event.target.value)}
              />
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!passkey.trim()) {
                    return;
                  }
                  await setPasskey(passkey.trim(), passkeyHint.trim() || undefined);
                  setPasskeyInput('');
                  setPasskeyHint('');
                }}
              >
                Save Passkey
              </button>
              <button type="button" onClick={() => void clearPasskey()}>
                Clear Passkey
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
