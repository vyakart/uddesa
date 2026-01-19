import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useBlackboardStore } from '@/stores/blackboardStore';

// Import Excalidraw styles
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  onElementsChange?: (elements: readonly ExcalidrawElement[]) => void;
}

export function ExcalidrawWrapper({ onElementsChange }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const canvas = useBlackboardStore((state) => state.canvas);
  const elements = useBlackboardStore((state) => state.elements);
  const saveElements = useBlackboardStore((state) => state.saveElements);
  const setAppState = useBlackboardStore((state) => state.setAppState);

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
    (newElements: readonly ExcalidrawElement[], appState: AppState) => {
      // Skip the first render to avoid saving initial empty state
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Update app state in store
      setAppState({
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      });

      // Notify parent of element changes
      onElementsChange?.(newElements);

      // Debounced save to database
      debouncedSave(newElements);
    },
    [debouncedSave, onElementsChange, setAppState]
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Determine theme based on canvas settings
  const theme: 'dark' | 'light' =
    canvas?.settings?.backgroundColor === '#2D3436' ||
    canvas?.settings?.backgroundColor === '#1a1a2e'
      ? 'dark'
      : 'light';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
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
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
