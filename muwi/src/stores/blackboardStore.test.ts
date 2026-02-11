import { db } from '@/db';
import { clearDatabase } from '@/test/db-utils';
import type { BlackboardCanvas } from '@/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { useBlackboardStore } from './blackboardStore';

function makeCanvas(overrides: Partial<BlackboardCanvas> = {}): BlackboardCanvas {
  const now = new Date('2026-02-11T00:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    name: 'Canvas',
    elementIds: [],
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    index: [],
    settings: {
      backgroundColor: '#fdfbf7',
      showGrid: false,
      gridSize: 20,
      defaultStrokeColor: '#F5F5F5',
      defaultStrokeWidth: 2,
      fonts: ['Inter'],
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeTextElement(
  id: string,
  text: string,
  x: number,
  y: number
): ExcalidrawElement {
  return {
    id,
    type: 'text',
    x,
    y,
    text,
  } as unknown as ExcalidrawElement;
}

describe('blackboardStore', () => {
  beforeEach(async () => {
    await clearDatabase(db);
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
  });

  it('creates a new canvas on initial load when database is empty', async () => {
    await useBlackboardStore.getState().loadCanvas();

    const state = useBlackboardStore.getState();
    expect(state.canvas).not.toBeNull();
    expect(state.canvas?.name).toBe('Untitled');
    expect(state.elements).toEqual([]);
    expect(state.index).toEqual([]);
    expect(await db.blackboardCanvases.count()).toBe(1);
  });

  it('loads an existing canvas, deserializes elements, and derives app state + index', async () => {
    const elements = [
      makeTextElement('h1', '# Heading A', 10, 300),
      makeTextElement('h2', '## Heading B', 20, 100),
      makeTextElement('p1', 'Plain text', 30, 200),
    ];

    const canvas = makeCanvas({
      id: 'canvas-existing',
      elementIds: JSON.stringify(elements) as unknown as string[],
      viewportState: { panX: 42, panY: 24, zoom: 1.5 },
    });
    await db.blackboardCanvases.add(canvas);

    await useBlackboardStore.getState().loadCanvas('canvas-existing');

    const state = useBlackboardStore.getState();
    expect(state.canvas?.id).toBe('canvas-existing');
    expect(state.elements).toHaveLength(3);
    expect(state.index.map((entry) => entry.title)).toEqual(['Heading B', 'Heading A']);
    expect(state.appState).toEqual({
      scrollX: 42,
      scrollY: 24,
      zoom: { value: 1.5 },
    });
  });

  it('saves elements, updates viewport/settings, rebuilds index, and deletes current canvas', async () => {
    await useBlackboardStore.getState().loadCanvas();
    const canvasId = useBlackboardStore.getState().canvas?.id;
    expect(canvasId).toBeTruthy();

    const elements = [
      makeTextElement('a', '# Alpha', 10, 200),
      makeTextElement('b', '## Beta', 10, 100),
      makeTextElement('c', 'Not a heading', 10, 300),
    ];

    await useBlackboardStore.getState().saveElements(elements);
    let state = useBlackboardStore.getState();
    expect(state.elements).toHaveLength(3);
    expect(state.index.map((entry) => entry.title)).toEqual(['Beta', 'Alpha']);

    await useBlackboardStore.getState().updateViewport({ panX: 7, panY: 8, zoom: 2 });
    await useBlackboardStore.getState().updateSettings({
      showGrid: true,
      backgroundColor: '#2D3436',
      gridSize: 32,
    });

    state = useBlackboardStore.getState();
    expect(state.canvas?.viewportState).toEqual({ panX: 7, panY: 8, zoom: 2 });
    expect(state.canvas?.settings.showGrid).toBe(true);
    expect(state.canvas?.settings.backgroundColor).toBe('#2D3436');
    expect(state.canvas?.settings.gridSize).toBe(32);

    useBlackboardStore.setState({
      elements: [makeTextElement('h3', '### Gamma', 0, 50)],
      index: [],
    });
    useBlackboardStore.getState().rebuildIndex();
    expect(useBlackboardStore.getState().index.map((entry) => entry.title)).toEqual(['Gamma']);

    await useBlackboardStore.getState().deleteCanvas(canvasId!);
    state = useBlackboardStore.getState();
    expect(state.canvas).toBeNull();
    expect(state.elements).toEqual([]);
    expect(state.index).toEqual([]);
    expect(await db.blackboardCanvases.get(canvasId!)).toBeUndefined();
  });
});
