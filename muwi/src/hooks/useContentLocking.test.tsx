import { act, renderHook, waitFor } from '@/test';
import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import { useSettingsStore } from '@/stores/settingsStore';
import * as settingsQueries from '@/db/queries/settings';
import { useContentLocking } from './useContentLocking';

describe('useContentLocking', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('loads initial lock state from database', async () => {
    await settingsQueries.lockContent('draft', 'draft-1');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLocked).toBe(true);
  });

  it('requires a passkey before locking content', async () => {
    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'entry', contentId: 'entry-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.lock()).toBe(false);
    });

    expect(result.current.error).toBe('Passkey is not set');
    await expect(settingsQueries.isContentLocked('entry', 'entry-1')).resolves.toBe(false);
  });

  it('locks content when passkey exists', async () => {
    await useSettingsStore.getState().setPasskey('secret-pass', 'hint');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'section', contentId: 'section-9' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.lock()).toBe(true);
    });

    expect(result.current.isLocked).toBe(true);
    await expect(settingsQueries.isContentLocked('section', 'section-9')).resolves.toBe(true);
  });

  it('unlocks only with the correct passkey', async () => {
    await useSettingsStore.getState().setPasskey('correct-pass', 'hint');
    await settingsQueries.lockContent('draft', 'draft-2');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-2' })
    );

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
    });

    await act(async () => {
      expect(await result.current.unlock('wrong-pass')).toBe(false);
    });
    expect(result.current.error).toBe('Invalid passkey');
    expect(result.current.isLocked).toBe(true);

    await act(async () => {
      expect(await result.current.unlock('correct-pass')).toBe(true);
    });
    expect(result.current.isLocked).toBe(false);
    await expect(settingsQueries.isContentLocked('draft', 'draft-2')).resolves.toBe(false);
  });

  it('toggles lock state using lock/unlock flows', async () => {
    await useSettingsStore.getState().setPasskey('toggle-pass');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'page', contentId: 'page-7' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.toggleLock()).toBe(true);
    });
    expect(result.current.isLocked).toBe(true);

    await act(async () => {
      expect(await result.current.toggleLock('toggle-pass')).toBe(true);
    });
    expect(result.current.isLocked).toBe(false);
  });
});

