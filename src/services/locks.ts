import { encrypt, decrypt, generateSalt, hashPassword, type EncryptedData } from './crypto';
import {
  deleteLock,
  loadLock,
  loadPages,
  saveLock,
  savePage,
  type Lock,
  type Page,
} from './db';
import { createId } from '../utils/id';

interface EncryptedPagePayload {
  pageId: string;
  data: EncryptedData;
}

interface LockPayload {
  pages: EncryptedPagePayload[];
}

function serialisePayload(payload: LockPayload): string {
  return JSON.stringify(payload);
}

function parsePayload(serialised?: string | null): LockPayload | null {
  if (!serialised) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialised) as LockPayload;
    if (!Array.isArray(parsed.pages)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        module: 'locks',
        message: 'Failed to parse lock payload',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}

async function sanitisePage(page: Page): Promise<void> {
  const sanitised: Page = {
    ...page,
    doc: undefined,
    scene: undefined,
  };

  await savePage(sanitised);
}

export async function lockDiary(diaryId: string, password: string): Promise<void> {
  const pages = await loadPages(diaryId);
  const salt = generateSalt();
  const now = Date.now();

  const encryptedPages: EncryptedPagePayload[] = [];

  for (const page of pages) {
    const serialisedPage = JSON.stringify(page);
    const encrypted = await encrypt(serialisedPage, password, salt);
    encryptedPages.push({ pageId: page.id, data: encrypted });
    await sanitisePage(page);
  }

  const passwordHash = await hashPassword(password, salt);
  const payload = serialisePayload({ pages: encryptedPages });

  const existingLock = await loadLock(diaryId);
  const lock: Lock = existingLock
    ? {
        ...existingLock,
        locked: true,
        salt,
        passwordHash,
        payload,
        updatedAt: now,
      }
    : {
        id: createId('lock'),
        diaryId,
        locked: true,
        salt,
        passwordHash,
        payload,
        createdAt: now,
        updatedAt: now,
      };

  await saveLock(lock);

  console.info(
    JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      module: 'locks',
      message: 'Diary locked',
      diaryId,
      pagesCount: pages.length,
    }),
  );
}

export async function unlockDiary(
  diaryId: string,
  password: string,
): Promise<void> {
  const lock = await loadLock(diaryId);
  if (!lock || !lock.locked) {
    throw new Error('Diary is not locked');
  }

  const computedHash = await hashPassword(password, lock.salt);
  if (computedHash !== lock.passwordHash) {
    throw new Error('Incorrect password');
  }

  const payload = parsePayload(lock.payload);
  if (!payload) {
    throw new Error('Unable to restore diary content');
  }

  for (const entry of payload.pages) {
    const json = await decrypt(entry.data, password);
    const page = JSON.parse(json) as Page;
    await savePage(page);
  }

  const now = Date.now();
  const updatedLock: Lock = {
    ...lock,
    locked: false,
    payload: undefined,
    updatedAt: now,
  };

  await saveLock(updatedLock);

  console.info(
    JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      module: 'locks',
      message: 'Diary unlocked',
      diaryId,
      pagesRestored: payload.pages.length,
    }),
  );
}

export async function clearLock(diaryId: string): Promise<void> {
  const lock = await loadLock(diaryId);
  if (!lock) {
    return;
  }

  await deleteLock(lock.id);
}
