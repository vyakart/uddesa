import type Dexie from 'dexie';
import type { Table } from 'dexie';

export type DiaryKind =
  | 'scratchpad'
  | 'blackboard'
  | 'journal'
  | 'drafts'
  | 'longform'
  | 'academic';

export type PageKind = 'canvas' | 'text';

export interface DiarySettings {
  background?: string;
  pageSize?: 'a5' | 'a4' | 'letter' | 'infinite';
  fontFamily?: string;
  fontOptions?: string[];
  theme?: 'light' | 'dark';
}

export interface Diary {
  id: string;
  kind: DiaryKind;
  title: string;
  settings: DiarySettings;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasScene {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
}

export interface Page {
  id: string;
  diaryId: string;
  kind: PageKind;
  scene?: CanvasScene;
  doc?: unknown;
  thumbDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lock {
  id: string;
  diaryId: string;
  pageId?: string;
  salt: string;
  locked: boolean;
}

export interface ExportBundle {
  version: number;
  exportedAt: number;
  diaries: Diary[];
  pages: Page[];
  locks: Lock[];
}

const supportsIndexedDb = (() => {
  if (typeof indexedDB === 'undefined') {
    return false;
  }
  try {
    const test = indexedDB;
    return typeof test !== 'undefined';
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to in-memory persistence.', err);
    return false;
  }
})();

const memoryStore = {
  diaries: new Map<string, Diary>(),
  pages: new Map<string, Page>(),
  locks: new Map<string, Lock>(),
};

type DexieModule = typeof import('dexie');
type DatabaseInstance = Dexie & {
  diaries: Table<Diary, string>;
  pages: Table<Page, string>;
  locks: Table<Lock, string>;
};

let dexieModule: DexieModule | null = null;
let db: DatabaseInstance | null = null;
let dexieUnavailable = !supportsIndexedDb;

function isDexieModuleLoaded(module: DexieModule | null): module is DexieModule {
  return module !== null;
}

async function loadDexieModule(): Promise<DexieModule | null> {
  if (dexieUnavailable) {
    return null;
  }

  if (isDexieModuleLoaded(dexieModule)) {
    return dexieModule;
  }

  if (typeof indexedDB === 'undefined') {
    dexieUnavailable = true;
    return null;
  }

  try {
    dexieModule = await import('dexie');
    return dexieModule;
  } catch (err) {
    console.warn('Dexie import failed, continuing with in-memory persistence.', err);
    dexieUnavailable = true;
    dexieModule = null;
    return null;
  }
}

function memoryListDiaries(): Diary[] {
  return Array.from(memoryStore.diaries.values()).sort((a, b) => a.createdAt - b.createdAt);
}

function memoryListPages(diaryId: string): Page[] {
  return Array.from(memoryStore.pages.values())
    .filter((page) => page.diaryId === diaryId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function createDatabaseInstance(module: DexieModule): DatabaseInstance {
  const DexieCtor = module.default as unknown as new (name: string, options?: unknown) => Dexie;
  const instance = new DexieCtor('uddesa') as DatabaseInstance;

  instance.version(1).stores({
    diaries: '&id, kind, updatedAt, createdAt',
    pages: '&id, diaryId, kind, updatedAt, createdAt',
    locks: '&id, diaryId, pageId, locked',
  });

  return instance;
}

async function ensureDb(): Promise<DatabaseInstance | null> {
  if (dexieUnavailable) {
    return null;
  }

  const module = await loadDexieModule();
  if (!module) {
    return null;
  }

  if (!db) {
    db = createDatabaseInstance(module);
  }

  if (db.isOpen()) {
    return db;
  }

  try {
    await db.open();
    return db;
  } catch (err) {
    console.warn('Failed to open IndexedDB, continuing with in-memory persistence.', err);
    try {
      db.close();
    } catch (closeErr) {
      console.warn('Failed to close Dexie instance after open error.', closeErr);
    }
    dexieUnavailable = true;
    db = null;
    dexieModule = null;
    return null;
  }
}

export async function listDiaries(): Promise<Diary[]> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    return memoryListDiaries();
  }

  const diaries = await dexieDb.diaries.toArray();
  return diaries.sort((a, b) => a.createdAt - b.createdAt);
}

export async function loadDiary(id: string): Promise<Diary | undefined> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    return memoryStore.diaries.get(id);
  }
  return dexieDb.diaries.get(id);
}

export async function saveDiary(diary: Diary): Promise<void> {
  const now = Date.now();
  const persisted: Diary = {
    ...diary,
    createdAt: diary.createdAt ?? now,
    updatedAt: now,
  };

  const dexieDb = await ensureDb();
  if (!dexieDb) {
    memoryStore.diaries.set(persisted.id, persisted);
    return;
  }

  await dexieDb.diaries.put(persisted);
}

export async function loadPages(diaryId: string): Promise<Page[]> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    return memoryListPages(diaryId);
  }
  return dexieDb.pages.where('diaryId').equals(diaryId).sortBy('createdAt');
}

export async function countPages(diaryId: string): Promise<number> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    return memoryListPages(diaryId).length;
  }
  return dexieDb.pages.where('diaryId').equals(diaryId).count();
}

export async function savePage(page: Page): Promise<void> {
  const now = Date.now();
  const persisted: Page = {
    ...page,
    createdAt: page.createdAt ?? now,
    updatedAt: now,
  };

  const dexieDb = await ensureDb();
  if (!dexieDb) {
    memoryStore.pages.set(persisted.id, persisted);
    return;
  }

  await dexieDb.pages.put(persisted);
}

export async function deletePage(id: string): Promise<void> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    memoryStore.pages.delete(id);
    return;
  }
  await dexieDb.pages.delete(id);
}

export async function deleteDiary(id: string): Promise<void> {
  const dexieDb = await ensureDb();
  if (!dexieDb) {
    memoryStore.diaries.delete(id);
    for (const page of memoryStore.pages.values()) {
      if (page.diaryId === id) {
        memoryStore.pages.delete(page.id);
      }
    }
    for (const lock of memoryStore.locks.values()) {
      if (lock.diaryId === id) {
        memoryStore.locks.delete(lock.id);
      }
    }
    return;
  }

  await dexieDb.transaction('rw', dexieDb.diaries, dexieDb.pages, dexieDb.locks, async () => {
    await dexieDb.diaries.delete(id);
    await dexieDb.pages.where('diaryId').equals(id).delete();
    await dexieDb.locks.where('diaryId').equals(id).delete();
  });
}

export async function exportAll(): Promise<Blob> {
  const dexieDb = await ensureDb();
  const [diaries, pages, locks] = dexieDb
    ? await Promise.all([dexieDb.diaries.toArray(), dexieDb.pages.toArray(), dexieDb.locks.toArray()])
    : [memoryListDiaries(), Array.from(memoryStore.pages.values()), Array.from(memoryStore.locks.values())];

  const bundle: ExportBundle = {
    version: 1,
    exportedAt: Date.now(),
    diaries,
    pages,
    locks,
  };

  return new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
}

export async function importAll(file: Blob): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<ExportBundle>;

  if (!parsed || !Array.isArray(parsed.diaries) || !Array.isArray(parsed.pages)) {
    throw new Error('Invalid backup file');
  }

  const dexieDb = await ensureDb();
  if (!dexieDb) {
    memoryStore.diaries.clear();
    memoryStore.pages.clear();
    memoryStore.locks.clear();
    for (const diary of parsed.diaries) {
      memoryStore.diaries.set(diary.id, diary);
    }
    for (const page of parsed.pages) {
      memoryStore.pages.set(page.id, page);
    }
    if (Array.isArray(parsed.locks)) {
      for (const lock of parsed.locks) {
        memoryStore.locks.set(lock.id, lock);
      }
    }
    return;
  }

  await dexieDb.transaction('rw', dexieDb.diaries, dexieDb.pages, dexieDb.locks, async () => {
    await dexieDb.diaries.bulkPut(parsed.diaries!);
    await dexieDb.pages.bulkPut(parsed.pages!);
    if (Array.isArray(parsed.locks)) {
      await dexieDb.locks.bulkPut(parsed.locks);
    }
  });
}
