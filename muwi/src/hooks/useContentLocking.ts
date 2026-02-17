import { useCallback, useEffect, useState } from 'react';
import type { LockedContent } from '@/types';
import * as settingsQueries from '@/db/queries/settings';
import { useSettingsStore } from '@/stores/settingsStore';

interface UseContentLockingOptions {
  contentType: LockedContent['contentType'];
  contentId: string;
  enabled?: boolean;
}

interface UseContentLockingResult {
  isLocked: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lock: () => Promise<boolean>;
  unlock: (passkey: string) => Promise<boolean>;
  toggleLock: (passkey?: string) => Promise<boolean>;
}

export function useContentLocking({
  contentType,
  contentId,
  enabled = true,
}: UseContentLockingOptions): UseContentLockingResult {
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const verifyPasskey = useSettingsStore((state) => state.verifyPasskey);

  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !contentId) {
      setIsLocked(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const locked = await settingsQueries.isContentLocked(contentType, contentId);
      setIsLocked(locked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read lock state');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, contentType, contentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lock = useCallback(async () => {
    if (!enabled || !contentId) {
      return false;
    }

    setError(null);

    if (isLocked) {
      return true;
    }

    const hasPass = await hasPasskey();
    if (!hasPass) {
      setError('Passkey is not set');
      return false;
    }

    try {
      await settingsQueries.lockContent(contentType, contentId);
      setIsLocked(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock content');
      return false;
    }
  }, [enabled, contentType, contentId, hasPasskey, isLocked]);

  const unlock = useCallback(
    async (passkey: string) => {
      if (!enabled || !contentId) {
        return false;
      }

      setError(null);

      const currentlyLocked = await settingsQueries.isContentLocked(contentType, contentId);
      if (!currentlyLocked) {
        setIsLocked(false);
        return true;
      }

      if (!passkey) {
        setError('Passkey is required');
        return false;
      }

      const valid = await verifyPasskey(passkey);
      if (!valid) {
        setError('Invalid passkey');
        return false;
      }

      try {
        await settingsQueries.unlockContent(contentType, contentId);
        setIsLocked(false);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unlock content');
        return false;
      }
    },
    [enabled, contentType, contentId, verifyPasskey]
  );

  const toggleLock = useCallback(
    async (passkey?: string) => {
      if (isLocked) {
        return unlock(passkey ?? '');
      }
      return lock();
    },
    [isLocked, lock, unlock]
  );

  return {
    isLocked,
    isLoading,
    error,
    refresh,
    lock,
    unlock,
    toggleLock,
  };
}
