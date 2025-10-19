import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types';
import type { Scene } from './excalApi';

type ExcalidrawExports = typeof import('@excalidraw/excalidraw');

let excalidrawModulePromise: Promise<ExcalidrawExports> | null = null;

async function loadExcalidrawModule(): Promise<ExcalidrawExports> {
  if (!excalidrawModulePromise) {
    excalidrawModulePromise = import('@excalidraw/excalidraw');
  }
  return excalidrawModulePromise;
}

function toRenderableElements(elements: readonly ExcalidrawElement[]): readonly NonDeleted<ExcalidrawElement>[] {
  return elements.filter((element) => !element.isDeleted) as readonly NonDeleted<ExcalidrawElement>[];
}

export async function exportToCanvas(
  scene: Scene,
  maxWidthOrHeight = 220,
): Promise<HTMLCanvasElement> {
  const { exportToCanvas: excalExportToCanvas } = await loadExcalidrawModule();

  return excalExportToCanvas({
    elements: toRenderableElements(scene.elements),
    appState: {
      ...scene.appState,
    },
    files: Object.keys(scene.files).length > 0 ? scene.files : null,
    maxWidthOrHeight,
  });
}

export async function exportToBlob(scene: Scene): Promise<Blob> {
  const { exportToBlob: excalExportToBlob } = await loadExcalidrawModule();

  return excalExportToBlob({
    elements: toRenderableElements(scene.elements),
    appState: {
      ...scene.appState,
    },
    files: Object.keys(scene.files).length > 0 ? scene.files : null,
    mimeType: 'image/png',
  });
}

export async function exportToSvg(scene: Scene): Promise<string> {
  const { exportToSvg: excalExportToSvg } = await loadExcalidrawModule();
  const svg = await excalExportToSvg({
    elements: toRenderableElements(scene.elements),
    appState: {
      ...scene.appState,
    },
    files: Object.keys(scene.files).length > 0 ? scene.files : null,
  });
  return new XMLSerializer().serializeToString(svg);
}
