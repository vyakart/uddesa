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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('sets refresh error from thrown Error values', async () => {
    vi.spyOn(settingsQueries, 'isContentLocked').mockRejectedValueOnce(new Error('refresh failed'));

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-refresh-error' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('refresh failed');
  });

  it('uses fallback refresh error message for non-Error failures', async () => {
    vi.spyOn(settingsQueries, 'isContentLocked').mockRejectedValueOnce('boom');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-refresh-fallback' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to read lock state');
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

  it('returns early without querying lock state when disabled', async () => {
    const lockStateSpy = vi.spyOn(settingsQueries, 'isContentLocked');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-disabled', enabled: false })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.lock()).toBe(false);
      expect(await result.current.unlock('anything')).toBe(false);
    });

    expect(lockStateSpy).not.toHaveBeenCalled();
  });

  it('returns true without relocking when state is already locked', async () => {
    await useSettingsStore.getState().setPasskey('already-locked-pass');
    await settingsQueries.lockContent('draft', 'draft-locked');
    const lockSpy = vi.spyOn(settingsQueries, 'lockContent');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-locked' })
    );

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
    });

    await act(async () => {
      expect(await result.current.lock()).toBe(true);
    });

    expect(lockSpy).not.toHaveBeenCalled();
  });

  it('handles lock failures for Error and fallback non-Error branches', async () => {
    await useSettingsStore.getState().setPasskey('lock-error-pass');
    const lockSpy = vi.spyOn(settingsQueries, 'lockContent');

    lockSpy.mockRejectedValueOnce(new Error('lock failed'));
    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'entry', contentId: 'entry-lock-error' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.lock()).toBe(false);
    });
    expect(result.current.error).toBe('lock failed');

    lockSpy.mockRejectedValueOnce('unknown lock error');
    await act(async () => {
      expect(await result.current.lock()).toBe(false);
    });
    expect(result.current.error).toBe('Failed to lock content');
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

  it('returns true when unlock is requested for content that is not locked', async () => {
    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-not-locked' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      expect(await result.current.unlock('any-pass')).toBe(true);
    });
    expect(result.current.isLocked).toBe(false);
  });

  it('requires passkey when unlock is attempted with an empty passkey', async () => {
    await useSettingsStore.getState().setPasskey('unlock-required-pass');
    await settingsQueries.lockContent('draft', 'draft-needs-passkey');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-needs-passkey' })
    );

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
    });

    await act(async () => {
      expect(await result.current.unlock('')).toBe(false);
    });
    expect(result.current.error).toBe('Passkey is required');
  });

  it('handles unlock failures for Error and fallback non-Error branches', async () => {
    await useSettingsStore.getState().setPasskey('unlock-error-pass');
    await settingsQueries.lockContent('draft', 'draft-unlock-error');
    const unlockSpy = vi.spyOn(settingsQueries, 'unlockContent');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-unlock-error' })
    );

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
    });

    unlockSpy.mockRejectedValueOnce(new Error('unlock failed'));
    await act(async () => {
      expect(await result.current.unlock('unlock-error-pass')).toBe(false);
    });
    expect(result.current.error).toBe('unlock failed');

    unlockSpy.mockRejectedValueOnce('unknown unlock error');
    await act(async () => {
      expect(await result.current.unlock('unlock-error-pass')).toBe(false);
    });
    expect(result.current.error).toBe('Failed to unlock content');
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

  it('uses empty-string fallback when toggling unlock without passkey argument', async () => {
    await useSettingsStore.getState().setPasskey('toggle-fallback-pass');
    await settingsQueries.lockContent('draft', 'draft-toggle-fallback');

    const { result } = renderHook(() =>
      useContentLocking({ contentType: 'draft', contentId: 'draft-toggle-fallback' })
    );

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
    });

    await act(async () => {
      expect(await result.current.toggleLock()).toBe(false);
    });
    expect(result.current.error).toBe('Passkey is required');
  });
});
