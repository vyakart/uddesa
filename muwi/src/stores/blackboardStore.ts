import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import type { BlackboardCanvas, ViewportState, IndexEntry, BlackboardSettings } from '@/types';
import { defaultBlackboardSettings } from '@/types/blackboard';
import { db } from '@/db/database';

// We store Excalidraw elements as serialized JSON in the canvas
// The BlackboardCanvas.elementIds will store the serialized scene data as a single JSON string
// This is a pragmatic approach that preserves all Excalidraw element properties

interface BlackboardState {
  canvas: BlackboardCanvas | null;
  elements: ExcalidrawElement[];
  appState: Partial<AppState> | null;
  index: IndexEntry[];
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Actions
  loadCanvas: (id?: string) => Promise<void>;
  createCanvas: (name?: string) => Promise<BlackboardCanvas>;
  saveElements: (elements: readonly ExcalidrawElement[]) => Promise<void>;
  updateViewport: (viewport: ViewportState) => Promise<void>;
  updateSettings: (settings: Partial<BlackboardSettings>) => Promise<void>;
  rebuildIndex: () => void;
  setAppState: (appState: Partial<AppState>) => void;
  getAllCanvases: () => Promise<BlackboardCanvas[]>;
  deleteCanvas: (id: string) => Promise<void>;
}

// Parse heading markers from text elements
function extractHeadings(elements: ExcalidrawElement[]): IndexEntry[] {
  const headings: IndexEntry[] = [];

  elements
    .filter((el): el is ExcalidrawElement & { type: 'text'; text: string } =>
      el.type === 'text' && 'text' in el && typeof el.text === 'string'
    )
    .forEach((el) => {
      const text = el.text.trim();
      let level: 1 | 2 | 3 | null = null;
      let title = text;

      // Check for heading markers (# prefix or special formatting)
      if (text.startsWith('### ')) {
        level = 3;
        title = text.slice(4);
      } else if (text.startsWith('## ')) {
        level = 2;
        title = text.slice(3);
      } else if (text.startsWith('# ')) {
        level = 1;
        title = text.slice(2);
      }

      if (level) {
        headings.push({
          id: `index-${el.id}`,
          elementId: el.id,
          title,
          level,
          position: { x: el.x, y: el.y },
        });
      }
    });

  // Sort by y position (top to bottom)
  return headings.sort((a, b) => a.position.y - b.position.y);
}

// Serialize Excalidraw elements to store in database
function serializeElements(elements: readonly ExcalidrawElement[]): string {
  return JSON.stringify(elements);
}

// Deserialize elements from database
function deserializeElements(data: string | string[]): ExcalidrawElement[] {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  // Legacy format: array of element IDs - return empty
  return [];
}

export const useBlackboardStore = create<BlackboardState>()(
  devtools(
    (set, get) => ({
      canvas: null,
      elements: [],
      appState: null,
      index: [],
      isLoading: false,
      error: null,
      isDirty: false,

      loadCanvas: async (id?: string) => {
        set({ isLoading: true, error: null });
        try {
          let canvas: BlackboardCanvas | undefined;

          if (id) {
            canvas = await db.blackboardCanvases.get(id);
          } else {
            // Load the most recent canvas or create a new one
            const canvases = await db.blackboardCanvases
              .orderBy('modifiedAt')
              .reverse()
              .limit(1)
              .toArray();
            canvas = canvases[0];
          }

          if (canvas) {
            // Deserialize elements from the elementIds field
            const elements = deserializeElements(canvas.elementIds as unknown as string);
            const index = extractHeadings(elements);

            set({
              canvas,
              elements,
              index,
              appState: {
                scrollX: canvas.viewportState.panX,
                scrollY: canvas.viewportState.panY,
                zoom: { value: canvas.viewportState.zoom as unknown as AppState['zoom']['value'] },
              },
              isLoading: false,
              isDirty: false,
            });
          } else {
            // Create a new canvas
            const newCanvas = await get().createCanvas('Untitled');
            set({
              canvas: newCanvas,
              elements: [],
              index: [],
              isLoading: false,
              isDirty: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load canvas',
            isLoading: false,
          });
        }
      },

      createCanvas: async (name: string = 'Untitled') => {
        const now = new Date();
        const newCanvas: BlackboardCanvas = {
          id: crypto.randomUUID(),
          name,
          elementIds: [], // Will be serialized JSON string when saved
          viewportState: { panX: 0, panY: 0, zoom: 1 },
          index: [],
          settings: { ...defaultBlackboardSettings },
          createdAt: now,
          modifiedAt: now,
        };

        await db.blackboardCanvases.add(newCanvas);
        return newCanvas;
      },

      saveElements: async (elements: readonly ExcalidrawElement[]) => {
        const { canvas } = get();
        if (!canvas) return;

        const serialized = serializeElements(elements);
        const index = extractHeadings([...elements]);

        await db.blackboardCanvases.update(canvas.id, {
          elementIds: serialized as unknown as string[],
          index,
          modifiedAt: new Date(),
        });

        set({
          elements: [...elements],
          index,
          canvas: { ...canvas, index, modifiedAt: new Date() },
          isDirty: false,
        });
      },

      updateViewport: async (viewport: ViewportState) => {
        const { canvas } = get();
        if (!canvas) return;

        await db.blackboardCanvases.update(canvas.id, {
          viewportState: viewport,
          modifiedAt: new Date(),
        });

        set({
          canvas: { ...canvas, viewportState: viewport, modifiedAt: new Date() },
        });
      },

      updateSettings: async (settings: Partial<BlackboardSettings>) => {
        const { canvas } = get();
        if (!canvas) return;

        const newSettings = { ...canvas.settings, ...settings };

        await db.blackboardCanvases.update(canvas.id, {
          settings: newSettings,
          modifiedAt: new Date(),
        });

        set({
          canvas: { ...canvas, settings: newSettings, modifiedAt: new Date() },
        });
      },

      rebuildIndex: () => {
        const { elements } = get();
        const index = extractHeadings(elements);
        set({ index });
      },

      setAppState: (appState: Partial<AppState>) => {
        set({ appState });
      },

      getAllCanvases: async () => {
        return db.blackboardCanvases.orderBy('modifiedAt').reverse().toArray();
      },

      deleteCanvas: async (id: string) => {
        await db.blackboardCanvases.delete(id);
        const { canvas } = get();
        if (canvas?.id === id) {
          set({ canvas: null, elements: [], index: [] });
        }
      },
    }),
    { name: 'blackboard-store' }
  )
);

// Selectors
export const selectBlackboardCanvas = (state: BlackboardState) => state.canvas;
export const selectBlackboardElements = (state: BlackboardState) => state.elements;
export const selectBlackboardIndex = (state: BlackboardState) => state.index;
export const selectBlackboardIsLoading = (state: BlackboardState) => state.isLoading;
export const selectBlackboardError = (state: BlackboardState) => state.error;
export const selectBlackboardAppState = (state: BlackboardState) => state.appState;
