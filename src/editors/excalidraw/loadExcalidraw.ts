import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types';

const EXCALIDRAW_VERSION = '0.18.0';
const EXCALIDRAW_CDN_BASE = `https://esm.run/@excalidraw/excalidraw@${EXCALIDRAW_VERSION}/dist/prod/`;

let moduleImport:
  | Promise<typeof import('@excalidraw/excalidraw')>
  | undefined;

const ensureAssetPath = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!('EXCALIDRAW_ASSET_PATH' in window)) {
    window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_CDN_BASE;
    return;
  }
  const currentValue = window.EXCALIDRAW_ASSET_PATH;
  if (typeof currentValue !== 'string' || currentValue.length === 0) {
    window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_CDN_BASE;
  }
};

export const loadExcalidraw = async () => {
  ensureAssetPath();

  if (!moduleImport) {
    moduleImport = import('@excalidraw/excalidraw');
  }

  return moduleImport;
};

export type { ExcalidrawImperativeAPI, ExcalidrawProps };
