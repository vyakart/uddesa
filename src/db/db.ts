import Dexie, { type Table } from 'dexie';

export interface ScratchpadItem {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
}

export interface ScratchpadPage {
    id: string; // diaryId-pageIndex
    diaryId: string;
    pageIndex: number;
    items: ScratchpadItem[];
    updatedAt: number;
}

export interface DiaryEntry {
    id?: number;
    diaryId: string;
    content: any; // JSON content depending on diary type
    createdAt: number;
    updatedAt: number;
}

export class UddesaDB extends Dexie {
    scratchpadPages!: Table<ScratchpadPage>;
    entries!: Table<DiaryEntry>;

    constructor() {
        super('UddesaDB');
        this.version(1).stores({
            scratchpadPages: 'id, diaryId, pageIndex',
            entries: '++id, diaryId, createdAt'
        });
    }
}

export const db = new UddesaDB();
