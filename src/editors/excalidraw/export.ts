import {
  exportToBlob as excalExportToBlob,
  exportToCanvas as excalExportToCanvas,
  exportToSvg as excalExportToSvg,
} from '@excalidraw/excalidraw';
import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types';
import type { Scene } from './excalApi';

function toRenderableElements(elements: readonly ExcalidrawElement[]): readonly NonDeleted<ExcalidrawElement>[] {
  return elements.filter((element) => !element.isDeleted) as readonly NonDeleted<ExcalidrawElement>[];
}

export function exportToCanvas(scene: Scene, maxWidthOrHeight = 220): Promise<HTMLCanvasElement> {
  return excalExportToCanvas({
    elements: toRenderableElements(scene.elements),
    appState: {
      ...scene.appState,
    },
    files: Object.keys(scene.files).length > 0 ? scene.files : null,
    maxWidthOrHeight,
  });
}

export function exportToBlob(scene: Scene): Promise<Blob> {
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
  const svg = await excalExportToSvg({
    elements: toRenderableElements(scene.elements),
    appState: {
      ...scene.appState,
    },
    files: Object.keys(scene.files).length > 0 ? scene.files : null,
  });
  return new XMLSerializer().serializeToString(svg);
}
