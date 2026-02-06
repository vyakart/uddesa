import { db } from '../database';
import type { GlobalSettings, LockedContent } from '@/types';
import { defaultGlobalSettings } from '@/types';

// Global Settings

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const settings = await db.settings.get('global');
  if (!settings) {
    const fallback = { ...defaultGlobalSettings };
    await db.settings.put(fallback);
    return fallback;
  }
  return settings;
}

export async function updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<void> {
  const existing = await db.settings.get('global');
  const next: GlobalSettings = {
    ...(existing ?? defaultGlobalSettings),
    ...updates,
    id: 'global',
  };
  await db.settings.put(next);
}

// Passkey management

export async function setPasskey(hash: string, salt: string, hint?: string): Promise<void> {
  await updateGlobalSettings({
    passkeyHash: hash,
    passkeySalt: salt,
    passkeyHint: hint,
  });
}

export async function clearPasskey(): Promise<void> {
  await updateGlobalSettings({
    passkeyHash: undefined,
    passkeySalt: undefined,
    passkeyHint: undefined,
  });
  // Unlock all content when passkey is cleared
  await db.lockedContent.clear();
}

export async function hasPasskey(): Promise<boolean> {
  const settings = await getGlobalSettings();
  return !!settings.passkeyHash;
}

export async function verifyPasskey(hash: string): Promise<boolean> {
  if (!hash) {
    return false;
  }
  const settings = await getGlobalSettings();
  return settings.passkeyHash === hash;
}

// Locked Content

export async function lockContent(
  contentType: LockedContent['contentType'],
  contentId: string
): Promise<string> {
  const locked: LockedContent = {
    id: `${contentType}-${contentId}`,
    contentType,
    contentId,
    lockedAt: new Date(),
  };
  return db.lockedContent.add(locked);
}

export async function unlockContent(
  contentType: LockedContent['contentType'],
  contentId: string
): Promise<void> {
  await db.lockedContent.delete(`${contentType}-${contentId}`);
}

export async function isContentLocked(
  contentType: LockedContent['contentType'],
  contentId: string
): Promise<boolean> {
  const locked = await db.lockedContent.get(`${contentType}-${contentId}`);
  return !!locked;
}

export async function getLockedContentByType(
  contentType: LockedContent['contentType']
): Promise<LockedContent[]> {
  return db.lockedContent.where('contentType').equals(contentType).toArray();
}

export async function getAllLockedContent(): Promise<LockedContent[]> {
  return db.lockedContent.toArray();
}
