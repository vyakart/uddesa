import { faker } from '@faker-js/faker';
import type { ScratchpadPage, TextBlock, DiaryEntry, Draft } from '@/types';

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
  return {
    id: faker.string.uuid(),
    date: faker.date.recent().toISOString().split('T')[0],
    content: faker.lorem.paragraphs(3),
    wordCount: faker.number.int({ min: 50, max: 500 }),
    mood: faker.helpers.arrayElement(['happy', 'sad', 'neutral', 'excited']),
    isLocked: false,
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(5),
    status: faker.helpers.arrayElement(['in-progress', 'review', 'complete']),
    wordCount: faker.number.int({ min: 100, max: 2000 }),
    tags: faker.helpers.arrayElements(['personal', 'work', 'ideas', 'fiction'], { min: 0, max: 3 }),
    isLocked: false,
    createdAt: faker.date.past(),
    modifiedAt: faker.date.recent(),
    ...overrides,
  };
}

// Database seeding utilities
export async function seedDatabase(/* db: MUWIDatabase */) {
  // Will be implemented when database is set up
  // This will populate the database with test data
}

export async function clearDatabase(/* db: MUWIDatabase */) {
  // Will be implemented when database is set up
  // This will clear all data from the database
}
