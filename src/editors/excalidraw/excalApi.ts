import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { exportToBlob as excalExportToBlob, exportToSvg as excalExportToSvg } from './export';

export interface Scene {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

let api: ExcalidrawImperativeAPI | null = null;
let memoryScene: Scene = {
  elements: [],
  appState: {},
  files: {},
};

function cloneFiles(files: BinaryFiles | Record<string, unknown> | undefined): BinaryFiles {
  if (!files) {
    return {} as BinaryFiles;
  }
  return Object.fromEntries(
    Object.entries(files).map(([key, value]) => [key, { ...(value as Record<string, unknown>) }]),
  ) as BinaryFiles;
}

function cloneScene(scene: Scene): Scene {
  return {
    elements: scene.elements.map((element) => ({ ...element })),
    appState: { ...scene.appState },
    files: cloneFiles(scene.files),
  };
}

export function registerApi(instance: ExcalidrawImperativeAPI): void {
  api = instance;
}

export function unregisterApi(instance: ExcalidrawImperativeAPI): void {
  if (api === instance) {
    api = null;
  }
}

export function load(scene: Scene): void {
  memoryScene = cloneScene(scene);
  if (api && Object.keys(memoryScene.files).length > 0) {
    api.addFiles(Object.values(memoryScene.files));
  }
  const payload = {
    elements: memoryScene.elements,
    appState: memoryScene.appState as AppState,
  } satisfies Parameters<ExcalidrawImperativeAPI['updateScene']>[0];
  api?.updateScene(payload);
}

export function read(): Scene {
  if (!api) {
    return cloneScene(memoryScene);
  }
  const elements = api.getSceneElements().map((element) => ({ ...element }));
  const appState = { ...api.getAppState() };
  const files = cloneFiles(api.getFiles());
  memoryScene = {
    elements,
    appState,
    files,
  };
  return cloneScene(memoryScene);
}

export function update(partial: Partial<Scene>): void {
  const nextElements = partial.elements
    ? partial.elements.map((element: ExcalidrawElement) => ({ ...element }))
    : memoryScene.elements;
  const nextAppState = partial.appState ? { ...memoryScene.appState, ...partial.appState } : memoryScene.appState;
  const mergedFiles = partial.files ? { ...memoryScene.files, ...partial.files } : memoryScene.files;

  memoryScene = {
    elements: nextElements,
    appState: nextAppState,
    files: cloneFiles(mergedFiles),
  };

  if (api && partial.files && Object.keys(partial.files).length > 0) {
    api.addFiles(Object.values(partial.files));
  }

  const sceneUpdate: Parameters<ExcalidrawImperativeAPI['updateScene']>[0] = {
    ...(partial.elements ? { elements: partial.elements } : {}),
    ...(partial.appState ? { appState: partial.appState as AppState } : {}),
  };
  api?.updateScene(sceneUpdate);
}

export async function exportScene(kind: 'png' | 'svg'): Promise<Blob> {
  const current = read();
  if (kind === 'png') {
    return excalExportToBlob(current);
  }
  const svg = await excalExportToSvg(current);
  return new Blob([svg], { type: 'image/svg+xml' });
}

interface CenterTarget {
  elementId?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export function centerOn(target: CenterTarget): void {
  if (!api) {
    return;
  }

  const options: Parameters<ExcalidrawImperativeAPI['scrollToContent']>[1] = {
    fitToViewport: true,
    viewportZoomFactor: 0.45,
    animate: true,
    duration: 240,
  };

  if (target.elementId) {
    api.scrollToContent(target.elementId, options);
    return;
  }

  if (target.bounds) {
    const { x, y, width, height } = target.bounds;
    const maxX = x + width;
    const maxY = y + height;
    const elements = api.getSceneElements();
    const withinBounds = elements.filter((element) => {
      const elementMaxX = element.x + element.width;
      const elementMaxY = element.y + element.height;
      return element.x >= x && element.y >= y && elementMaxX <= maxX && elementMaxY <= maxY;
    });
    if (withinBounds.length > 0) {
      api.scrollToContent(withinBounds, options);
    } else {
      api.scrollToContent(undefined, options);
    }
  }
}
