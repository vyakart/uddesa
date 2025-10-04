import type { BinaryFiles } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { Scene } from './excalApi';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function cloneFiles(files: BinaryFiles | Record<string, unknown> | undefined): BinaryFiles {
  if (!files) {
    return {} as BinaryFiles;
  }

  return Object.fromEntries(
    Object.entries(files).map(([key, value]) => [key, { ...(value as Record<string, unknown>) }]),
  ) as BinaryFiles;
}

export function emptyScene(): Scene {
  return {
    elements: [],
    appState: {},
    files: {},
  };
}

export function packScene(scene: Scene | null | undefined): Scene {
  if (!scene) {
    return emptyScene();
  }

  return {
    elements: scene.elements.map((element) => ({ ...element })),
    appState: { ...scene.appState },
    files: cloneFiles(scene.files),
  };
}

export function unpackScene(raw: unknown): Scene {
  if (!isObject(raw)) {
    return emptyScene();
  }

  const candidate = raw as Partial<Scene>;
  const elements = Array.isArray(candidate.elements)
    ? (candidate.elements as ExcalidrawElement[]).map((element) => ({ ...element }))
    : [];
  const appState = isObject(candidate.appState) ? { ...candidate.appState } : {};
  const files = isObject(candidate.files) ? cloneFiles(candidate.files as Record<string, unknown>) : ({} as BinaryFiles);

  return {
    elements,
    appState,
    files,
  };
}
