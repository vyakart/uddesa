import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useBlackboardStore } from '@/stores/blackboardStore';

import '@excalidraw/excalidraw/index.css';

interface ExcalidrawWrapperProps {
  onElementsChange?: () => void;
  navigationTarget?: {
    elementId: string;
    position: { x: number; y: number };
    requestedAt: number;
  } | null;
  onNavigationHandled?: () => void;
}

function resolveExcalidrawFontFamily(fontName: string | undefined): number {
  switch (fontName) {
    case 'Caveat':
      return FONT_FAMILY['Comic Shanns'];
    case 'JetBrains Mono':
      return FONT_FAMILY.Cascadia;
    case 'Crimson Pro':
      return FONT_FAMILY.Nunito;
    case 'Inter':
    default:
      return FONT_FAMILY.Helvetica;
  }
}

export function ExcalidrawWrapper({
  onElementsChange,
  navigationTarget,
  onNavigationHandled,
}: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const canvas = useBlackboardStore((state) => state.canvas);
  const elements = useBlackboardStore((state) => state.elements);
  const saveElements = useBlackboardStore((state) => state.saveElements);
  const updateViewport = useBlackboardStore((state) => state.updateViewport);
  const selectedFontFamily = resolveExcalidrawFontFamily(canvas?.settings?.defaultFont);

  // Debounced save function
  const debouncedSave = useCallback(
    (newElements: readonly ExcalidrawElement[], appState?: AppState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        void saveElements(newElements);
        if (appState) {
          const zoomValue = typeof appState.zoom === 'number' ? appState.zoom : appState.zoom?.value ?? 1;
          void updateViewport({
            panX: appState.scrollX ?? 0,
            panY: appState.scrollY ?? 0,
            zoom: zoomValue,
          });
        }
      }, 500);
    },
    [saveElements, updateViewport]
  );

  // Handle changes from Excalidraw
  const handleChange = useCallback(
    (newElements: readonly ExcalidrawElement[], appState: AppState) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onElementsChange?.();
      debouncedSave(newElements, appState);
    },
    [debouncedSave, onElementsChange]
  );

  // Update Excalidraw when canvas settings change
  useEffect(() => {
    if (excalidrawAPI && canvas?.settings) {
      const appStateUpdate: Partial<AppState> = {
        viewBackgroundColor: canvas.settings.backgroundColor,
        currentItemFontFamily: selectedFontFamily as AppState['currentItemFontFamily'],
      };
      if (canvas.settings.showGrid) {
        appStateUpdate.gridSize = canvas.settings.gridSize ?? 20;
      }
      excalidrawAPI.updateScene({ appState: appStateUpdate as unknown as AppState });

      const selectedIds = excalidrawAPI.getAppState().selectedElementIds;
      const sceneElements = excalidrawAPI.getSceneElements();
      let hasUpdatedSelectedText = false;
      const updatedElements = sceneElements.map((element) => {
        if (element.type !== 'text' || !selectedIds[element.id] || element.fontFamily === selectedFontFamily) {
          return element;
        }

        hasUpdatedSelectedText = true;
        return {
          ...element,
          fontFamily: selectedFontFamily,
          version: element.version + 1,
        };
      });

      if (hasUpdatedSelectedText) {
        excalidrawAPI.updateScene({ elements: updatedElements });
        void saveElements(updatedElements);
      }
    }
  }, [canvas?.settings, excalidrawAPI, saveElements, selectedFontFamily]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!navigationTarget || !excalidrawAPI) {
      return;
    }

    const bounds = wrapperRef.current?.getBoundingClientRect();
    const centerX = (bounds?.width ?? window.innerWidth) / 2;
    const centerY = (bounds?.height ?? window.innerHeight) / 2;

    const scrollX = centerX - navigationTarget.position.x;
    const scrollY = centerY - navigationTarget.position.y;
    const zoom = canvas?.viewportState.zoom ?? 1;

    excalidrawAPI.updateScene({
      appState: {
        scrollX,
        scrollY,
      },
    });
    void updateViewport({
      panX: scrollX,
      panY: scrollY,
      zoom,
    });
    onNavigationHandled?.();
  }, [canvas?.viewportState.zoom, excalidrawAPI, navigationTarget, onNavigationHandled, updateViewport]);

  const theme: 'dark' | 'light' =
    canvas?.settings?.backgroundColor === '#2D3436' ||
    canvas?.settings?.backgroundColor === '#1a1a2e'
      ? 'dark'
      : 'light';

  return (
    <div ref={wrapperRef} data-testid="excalidraw-wrapper-root" style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: elements,
          appState: {
            viewBackgroundColor: canvas?.settings?.backgroundColor || '#fdfbf7',
            gridSize: canvas?.settings?.showGrid ? (canvas?.settings?.gridSize ?? 20) : undefined,
            scrollX: canvas?.viewportState?.panX ?? 0,
            scrollY: canvas?.viewportState?.panY ?? 0,
            zoom: {
              value: (canvas?.viewportState?.zoom ?? 1) as unknown as AppState['zoom']['value'],
            },
            currentItemFontFamily: selectedFontFamily as AppState['currentItemFontFamily'],
          },
        }}
        onChange={handleChange}
        theme={theme}
        gridModeEnabled={canvas?.settings?.showGrid || false}
      />
    </div>
  );
}
