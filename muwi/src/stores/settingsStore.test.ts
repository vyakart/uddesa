import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearDatabase(db);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('loads and updates global settings', async () => {
    const state = useSettingsStore.getState();

    await state.loadSettings();
    expect(useSettingsStore.getState().isLoaded).toBe(true);
    expect(useSettingsStore.getState().global.theme).toBe('system');

    await state.updateGlobalSettings({ theme: 'dark', accentColor: '#111111' });
    expect(useSettingsStore.getState().global.theme).toBe('dark');
    expect(useSettingsStore.getState().global.accentColor).toBe('#111111');

    await state.updateTheme('light');
    expect(useSettingsStore.getState().global.theme).toBe('light');
  });

  it('updates per-diary settings through generic and specific actions', () => {
    const state = useSettingsStore.getState();

    state.updateDiarySettings('scratchpad', { orientation: 'landscape' });
    expect(useSettingsStore.getState().scratchpad.orientation).toBe('landscape');

    state.updateDiarySettings('blackboard', { gridSize: 32 });
    expect(useSettingsStore.getState().blackboard.gridSize).toBe(32);

    state.updateDiarySettings('personalDiary', { dateFormat: 'DD/MM/YYYY' });
    expect(useSettingsStore.getState().personalDiary.dateFormat).toBe('DD/MM/YYYY');

    state.updateDraftsSettings({ defaultFont: 'Georgia' });
    expect(useSettingsStore.getState().drafts.defaultFont).toBe('Georgia');

    state.updateLongDraftsSettings({ defaultFont: 'Georgia' });
    expect(useSettingsStore.getState().longDrafts.defaultFont).toBe('Georgia');

    state.updateAcademicSettings({ citationStyle: 'mla9' });
    expect(useSettingsStore.getState().academic.citationStyle).toBe('mla9');
  });

  it('supports passkey set, verify, and clear', async () => {
    const state = useSettingsStore.getState();

    expect(await state.hasPasskey()).toBe(false);

    await state.setPasskey('hash-a', 'hint-a');
    expect(await state.hasPasskey()).toBe(true);
    expect(useSettingsStore.getState().global.passkeySalt).toBeDefined();
    expect(await state.verifyPasskey('hash-a')).toBe(true);
    expect(await state.verifyPasskey('wrong-hash')).toBe(false);

    await state.clearPasskey();
    expect(await state.hasPasskey()).toBe(false);
  });
});
