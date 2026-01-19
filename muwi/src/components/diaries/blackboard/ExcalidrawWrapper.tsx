import { useCallback, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import { useBlackboardStore } from '@/stores/blackboardStore';
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  onElementsChange?: (elements: readonly ExcalidrawElement[]) => void;
}

export function ExcalidrawWrapper({ onElementsChange }: ExcalidrawWrapperProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Initial data for Excalidraw
  const initialData = {
    elements: elements,
    appState: {
      viewBackgroundColor: canvas?.settings?.backgroundColor || '#fdfbf7',
      gridSize: canvas?.settings?.showGrid ? (canvas?.settings?.gridSize || 20) : undefined,
      theme: theme,
    },
    scrollToContent: elements.length > 0,
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        theme={theme}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: true,
          },
          tools: {
            image: false,
          },
        }}
        gridModeEnabled={canvas?.settings?.showGrid || false}
      />
    </div>
  );
}
