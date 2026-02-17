import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { BlackboardCanvas, CanvasElement } from '@/types';
import {
  createCanvas,
  createElement,
  deleteCanvas,
  deleteElement,
  getAllCanvases,
  getCanvas,
  getElement,
  getElementsByCanvas,
  getHeadingElements,
  rebuildIndex,
  updateCanvas,
  updateElement,
} from './blackboard';

function makeCanvas(overrides: Partial<BlackboardCanvas> = {}): BlackboardCanvas {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    name: 'Test Canvas',
    elementIds: [],
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    index: [],
    settings: {
      backgroundColor: '#2D3436',
      showGrid: false,
      gridSize: 20,
      defaultStrokeColor: '#F5F5F5',
      defaultStrokeWidth: 2,
      fonts: ['Inter'],
      defaultFont: 'Inter',
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeElement(canvasId: string, overrides: Partial<CanvasElement> = {}): CanvasElement {
  const now = new Date('2026-02-06T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    canvasId,
    type: 'text',
    position: { x: 100, y: 200 },
    content: 'Heading A',
    style: {
      strokeColor: '#F5F5F5',
      strokeWidth: 2,
      fontFamily: 'Inter',
      fontSize: 18,
      imperfectionSeed: 123,
    },
    headingLevel: 1,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('blackboard queries', () => {
  beforeEach(async () => {
    await clearDatabase(db);
  });

  it('supports canvas CRUD', async () => {
    const canvas = makeCanvas();
    await createCanvas(canvas);

    expect((await getCanvas(canvas.id))?.name).toBe('Test Canvas');
    expect(await getAllCanvases()).toHaveLength(1);

    await updateCanvas(canvas.id, { name: 'Renamed Canvas' });
    expect((await getCanvas(canvas.id))?.name).toBe('Renamed Canvas');

    await deleteCanvas(canvas.id);
    expect(await getCanvas(canvas.id)).toBeUndefined();
  });

  it('supports element CRUD and heading index rebuild', async () => {
    const canvas = makeCanvas();
    await createCanvas(canvas);

    const heading = makeElement(canvas.id);
    const normalText = makeElement(canvas.id, {
      content: 'Plain text',
      headingLevel: null,
      position: { x: 100, y: 300 },
    });

    await createElement(heading);
    await createElement(normalText);

    expect(await getElementsByCanvas(canvas.id)).toHaveLength(2);
    expect(await getHeadingElements(canvas.id)).toHaveLength(1);

    await updateElement(heading.id, { content: 'Heading Updated' });
    expect((await getElement(heading.id))?.content).toBe('Heading Updated');

    const index = await rebuildIndex(canvas.id);
    expect(index).toHaveLength(1);
    expect(index[0].title).toBe('Heading Updated');

    await deleteElement(heading.id);
    expect(await getElement(heading.id)).toBeUndefined();

    const updatedCanvas = await getCanvas(canvas.id);
    expect(updatedCanvas?.elementIds).toEqual([normalText.id]);
  });

  it('cascades element deletion when deleting a canvas', async () => {
    const canvas = makeCanvas();
    const element = makeElement(canvas.id);
    await createCanvas(canvas);
    await createElement(element);

    await deleteCanvas(canvas.id);
    expect(await getElement(element.id)).toBeUndefined();
    expect(await getElementsByCanvas(canvas.id)).toHaveLength(0);
  });
});
