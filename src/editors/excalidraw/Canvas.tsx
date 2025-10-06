import { useEffect, useMemo, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { load, read, registerApi, unregisterApi, type Scene } from './excalApi';

export interface CanvasProps {
  pageKey: string;
  scene: Scene;
  onSceneChange: (scene: Scene) => void;
  className?: string;
}

export function Canvas({ pageKey, scene, onSceneChange, className }: CanvasProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const currentPageKey = useRef<string | null>(null);
  const skipNextLoad = useRef(false);
  const [apiVersion, bumpApiVersion] = useState(0);

  useEffect(() => {
    if (!apiRef.current) {
      return;
    }

    const isNewPage = currentPageKey.current !== pageKey;
    const shouldSkip = skipNextLoad.current;

    if (isNewPage || !shouldSkip) {
      currentPageKey.current = pageKey;
      load(scene);
    }

    skipNextLoad.current = false;
  }, [apiVersion, pageKey, scene]);

  useEffect(() => {
    return () => {
      if (apiRef.current) {
        unregisterApi(apiRef.current);
        apiRef.current = null;
      }
      skipNextLoad.current = false;
      currentPageKey.current = null;
    };
  }, []);

  const initialData = useMemo(() => scene, [scene]);

  return (
    <div className={className ?? 'excalidraw-canvas'}>
      <Excalidraw
        initialData={initialData}
        excalidrawAPI={(api) => {
          if (!api) {
            return;
          }

          const hasChanged = apiRef.current !== api;
          apiRef.current = api;
          registerApi(api);

          if (hasChanged) {
            bumpApiVersion((version) => version + 1);
          }
        }}
        viewModeEnabled={false}
        onChange={() => {
          skipNextLoad.current = true;
          onSceneChange(read());
        }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveAsImage: false,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
}
