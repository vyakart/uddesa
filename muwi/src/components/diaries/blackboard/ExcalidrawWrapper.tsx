import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useBlackboardStore } from '@/stores/blackboardStore';

import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  onElementsChange?: () => void;
}

export function ExcalidrawWrapper({ onElementsChange }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const canvas = useBlackboardStore((state) => state.canvas);
  const elements = useBlackboardStore((state) => state.elements);
  const saveElements = useBlackboardStore((state) => state.saveElements);

  // Debounced save function
  const debouncedSave = useCallback(
    (newElements: readonly ExcalidrawElement[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveElements(newElements);
      }, 500);
    },
    [saveElements]
  );

  // Handle changes from Excalidraw
  const handleChange = useCallback(
    (newElements: readonly ExcalidrawElement[], _appState: AppState) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onElementsChange?.();
      debouncedSave(newElements);
    },
    [debouncedSave, onElementsChange]
  );

  // Update Excalidraw when canvas settings change
  useEffect(() => {
    if (excalidrawAPI && canvas?.settings) {
      excalidrawAPI.updateScene({
        appState: {
          viewBackgroundColor: canvas.settings.backgroundColor,
          gridSize: canvas.settings.showGrid ? (canvas.settings.gridSize || 20) : null,
        },
      });
    }
  }, [excalidrawAPI, canvas?.settings?.backgroundColor, canvas?.settings?.showGrid, canvas?.settings?.gridSize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const theme: 'dark' | 'light' =
    canvas?.settings?.backgroundColor === '#2D3436' ||
    canvas?.settings?.backgroundColor === '#1a1a2e'
      ? 'dark'
      : 'light';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: elements,
          appState: {
            viewBackgroundColor: canvas?.settings?.backgroundColor || '#fdfbf7',
            gridSize: canvas?.settings?.showGrid ? (canvas?.settings?.gridSize || 20) : null,
          },
        }}
        onChange={handleChange}
        theme={theme}
        gridModeEnabled={canvas?.settings?.showGrid || false}
      />
    </div>
  );
}
