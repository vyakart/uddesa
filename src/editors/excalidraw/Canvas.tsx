import { useEffect, useMemo, useRef } from 'react';
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

  useEffect(() => {
    if (!apiRef.current) {
      return;
    }

    if (currentPageKey.current === pageKey) {
      return;
    }

    currentPageKey.current = pageKey;
    load(scene);
  }, [pageKey, scene]);

  useEffect(() => {
    const api = apiRef.current;
    return () => {
      if (api) {
        unregisterApi(api);
      }
    };
  }, []);

  const initialData = useMemo(() => scene, [scene]);

  return (
    <div className={className ?? 'excalidraw-canvas'}>
      <Excalidraw
        initialData={initialData}
        excalidrawAPI={(api) => {
          apiRef.current = api;
          registerApi(api);
          currentPageKey.current = pageKey;
          load(scene);
        }}
        viewModeEnabled={false}
        onChange={() => {
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
