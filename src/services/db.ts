import Dexie, { type Table } from 'dexie';

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

class UddesaDatabase extends Dexie {
  diaries!: Table<Diary, string>;
  pages!: Table<Page, string>;
  locks!: Table<Lock, string>;

  constructor() {
    super('uddesa');

    this.version(1).stores({
      diaries: '&id, kind, updatedAt, createdAt',
      pages: '&id, diaryId, kind, updatedAt, createdAt',
      locks: '&id, diaryId, pageId, locked',
    });
  }
}

export const db = new UddesaDatabase();

export async function listDiaries(): Promise<Diary[]> {
  const diaries = await db.diaries.toArray();
  return diaries.sort((a, b) => a.createdAt - b.createdAt);
}

export function loadDiary(id: string): Promise<Diary | undefined> {
  return db.diaries.get(id);
}

export async function saveDiary(diary: Diary): Promise<void> {
  const now = Date.now();
  await db.diaries.put({
    ...diary,
    createdAt: diary.createdAt ?? now,
    updatedAt: now,
  });
}

export function loadPages(diaryId: string): Promise<Page[]> {
  return db.pages.where('diaryId').equals(diaryId).sortBy('createdAt');
}

export async function savePage(page: Page): Promise<void> {
  const now = Date.now();
  await db.pages.put({
    ...page,
    createdAt: page.createdAt ?? now,
    updatedAt: now,
  });
}

export function deletePage(id: string): Promise<void> {
  return db.pages.delete(id);
}

export async function deleteDiary(id: string): Promise<void> {
  await db.transaction('rw', db.diaries, db.pages, db.locks, async () => {
    await db.diaries.delete(id);
    await db.pages.where('diaryId').equals(id).delete();
    await db.locks.where('diaryId').equals(id).delete();
  });
}

export async function exportAll(): Promise<Blob> {
  const [diaries, pages, locks] = await Promise.all([
    db.diaries.toArray(),
    db.pages.toArray(),
    db.locks.toArray(),
  ]);

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

  await db.transaction('rw', db.diaries, db.pages, db.locks, async () => {
    await db.diaries.bulkPut(parsed.diaries!);
    await db.pages.bulkPut(parsed.pages!);
    if (Array.isArray(parsed.locks)) {
      await db.locks.bulkPut(parsed.locks);
    }
  });
}
