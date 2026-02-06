import { faker } from '@faker-js/faker';
import type { MUWIDatabase } from '@/db';
import { defaultGlobalSettings, type CategoryName, type DiaryEntry, type Draft, type ScratchpadPage, type TextBlock } from '@/types';

export interface SeedDatabaseOptions {
  pages?: number;
  blocksPerPage?: number;
  entries?: number;
  drafts?: number;
  includeSettings?: boolean;
}

export interface SeedDatabaseResult {
  pages: ScratchpadPage[];
  textBlocks: TextBlock[];
  entries: DiaryEntry[];
  drafts: Draft[];
}

const DEFAULT_SEED_OPTIONS: Required<SeedDatabaseOptions> = {
  pages: 3,
  blocksPerPage: 2,
  entries: 5,
  drafts: 4,
  includeSettings: true,
};

function toIsoDateOnly(date: Date): string {
  const [dateOnly] = date.toISOString().split('T');
  return dateOnly;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Seed generators for test data
export function createMockTextBlock(overrides: Partial<TextBlock> = {}): TextBlock {
  return {
    id: faker.string.uuid(),
    pageId: faker.string.uuid(),
    content: faker.lorem.sentence(),
    position: { x: faker.number.int({ min: 0, max: 300 }), y: faker.number.int({ min: 0, max: 500 }) },
    width: 'auto',
    fontSize: 16,
    fontFamily: 'Inter',
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockScratchpadPage(overrides: Partial<ScratchpadPage> = {}): ScratchpadPage {
  return {
    id: faker.string.uuid(),
    pageNumber: faker.number.int({ min: 1, max: 100 }),
    categoryColor: '#BBDEFB',
    categoryName: 'notes',
    textBlockIds: [],
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    isLocked: false,
    ...overrides,
  };
}

export function createMockDiaryEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  const content = faker.lorem.paragraphs(3);
  return {
    id: faker.string.uuid(),
    date: toIsoDateOnly(faker.date.recent()),
    content,
    wordCount: countWords(content),
    mood: faker.helpers.arrayElement(['happy', 'sad', 'neutral', 'excited']),
    isLocked: false,
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockDraft(overrides: Partial<Draft> = {}): Draft {
  const content = faker.lorem.paragraphs(5);
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content,
    status: faker.helpers.arrayElement(['in-progress', 'review', 'complete']),
    wordCount: countWords(content),
    tags: faker.helpers.arrayElements(['personal', 'work', 'ideas', 'fiction'], { min: 0, max: 3 }),
    isLocked: false,
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    ...overrides,
  };
}

// Database seeding utilities
export async function seedDatabase(database: MUWIDatabase, options: SeedDatabaseOptions = {}): Promise<SeedDatabaseResult> {
  const config = { ...DEFAULT_SEED_OPTIONS, ...options };
  const categories: CategoryName[] = ['ideas', 'todos', 'notes', 'questions', 'misc'];

  const pages: ScratchpadPage[] = [];
  const textBlocks: TextBlock[] = [];

  for (let pageIndex = 0; pageIndex < config.pages; pageIndex += 1) {
    const pageId = faker.string.uuid();
    const pageBlockIds: string[] = [];
    const categoryName = categories[pageIndex % categories.length];
    const categoryColor = {
      ideas: '#FFF9C4',
      todos: '#C8E6C9',
      notes: '#BBDEFB',
      questions: '#E1BEE7',
      misc: '#F5F5F5',
    }[categoryName];

    for (let blockIndex = 0; blockIndex < config.blocksPerPage; blockIndex += 1) {
      const block = createMockTextBlock({
        id: faker.string.uuid(),
        pageId,
      });
      textBlocks.push(block);
      pageBlockIds.push(block.id);
    }

    pages.push(
      createMockScratchpadPage({
        id: pageId,
        pageNumber: pageIndex + 1,
        categoryName,
        categoryColor,
        textBlockIds: pageBlockIds,
      })
    );
  }

  const entries = Array.from({ length: config.entries }, () => {
    const entryDate = faker.date.recent({ days: 365 });
    return createMockDiaryEntry({
      id: faker.string.uuid(),
      date: toIsoDateOnly(entryDate),
    });
  });

  const drafts = Array.from({ length: config.drafts }, () =>
    createMockDraft({
      id: faker.string.uuid(),
    })
  );

  if (pages.length > 0) {
    await database.scratchpadPages.bulkPut(pages);
  }
  if (textBlocks.length > 0) {
    await database.textBlocks.bulkPut(textBlocks);
  }
  if (entries.length > 0) {
    await database.diaryEntries.bulkPut(entries);
  }
  if (drafts.length > 0) {
    await database.drafts.bulkPut(drafts);
  }
  if (config.includeSettings) {
    await database.settings.put(defaultGlobalSettings);
  }

  return { pages, textBlocks, entries, drafts };
}

export async function clearDatabase(database: MUWIDatabase): Promise<void> {
  await Promise.all(database.tables.map((table) => table.clear()));
}
