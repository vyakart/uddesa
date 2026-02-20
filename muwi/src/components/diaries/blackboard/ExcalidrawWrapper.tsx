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

interface BlackboardCanvasTokens {
  canvas: string;
  grid: string;
  text: string;
  strokeDefault: string;
}

const BLACKBOARD_TOKEN_FALLBACKS: BlackboardCanvasTokens = {
  canvas: 'var(--color-bb-canvas)',
  grid: 'var(--color-bb-canvas-grid)',
  text: 'var(--color-bb-text)',
  strokeDefault: 'var(--color-bb-stroke-default)',
};

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

function resolveBlackboardToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function resolveBlackboardCanvasTokens(): BlackboardCanvasTokens {
  return {
    canvas: resolveBlackboardToken('--color-bb-canvas', BLACKBOARD_TOKEN_FALLBACKS.canvas),
    grid: resolveBlackboardToken('--color-bb-canvas-grid', BLACKBOARD_TOKEN_FALLBACKS.grid),
    text: resolveBlackboardToken('--color-bb-text', BLACKBOARD_TOKEN_FALLBACKS.text),
    strokeDefault: resolveBlackboardToken('--color-bb-stroke-default', BLACKBOARD_TOKEN_FALLBACKS.strokeDefault),
  };
}

function getZoomValue(appState: AppState | undefined): number {
  if (!appState) {
    return 1;
  }
  return typeof appState.zoom === 'number' ? appState.zoom : appState.zoom?.value ?? 1;
}

function normalizeGridOffset(offset: number, gridPitch: number): number {
  if (gridPitch <= 0) {
    return 0;
  }
  return ((offset % gridPitch) + gridPitch) % gridPitch;
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
  const tokenColors = resolveBlackboardCanvasTokens();
  const viewport = canvas?.viewportState ?? { panX: 0, panY: 0, zoom: 1 };
  const defaultStrokeColor = canvas?.settings?.defaultStrokeColor ?? tokenColors.strokeDefault;
  const isGridVisible = canvas?.settings?.showGrid ?? false;
  const gridSize = canvas?.settings?.gridSize ?? 20;
  const gridPitch = Math.max(8, gridSize * viewport.zoom);
  const gridOffsetX = normalizeGridOffset(viewport.panX, gridPitch);
  const gridOffsetY = normalizeGridOffset(viewport.panY, gridPitch);

  // Debounced save function
  const debouncedSave = useCallback(
    (newElements: readonly ExcalidrawElement[], appState?: AppState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        void saveElements(newElements);
        if (appState) {
          const zoomValue = getZoomValue(appState);
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
        viewBackgroundColor: 'transparent',
        currentItemFontFamily: selectedFontFamily as AppState['currentItemFontFamily'],
        currentItemStrokeColor: defaultStrokeColor,
        currentItemBackgroundColor: 'transparent',
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
  }, [canvas?.settings, defaultStrokeColor, excalidrawAPI, saveElements, selectedFontFamily]);

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

  return (
    <div
      ref={wrapperRef}
      data-testid="excalidraw-wrapper-root"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: tokenColors.canvas,
        backgroundImage: isGridVisible
          ? `linear-gradient(to right, ${tokenColors.grid} 1px, transparent 1px), linear-gradient(to bottom, ${tokenColors.grid} 1px, transparent 1px)`
          : undefined,
        backgroundSize: isGridVisible ? `${gridPitch}px ${gridPitch}px` : undefined,
        backgroundPosition: isGridVisible ? `${gridOffsetX}px ${gridOffsetY}px` : undefined,
      }}
    >
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: elements,
          appState: {
            viewBackgroundColor: 'transparent',
            gridSize: canvas?.settings?.showGrid ? (canvas?.settings?.gridSize ?? 20) : undefined,
            scrollX: canvas?.viewportState?.panX ?? 0,
            scrollY: canvas?.viewportState?.panY ?? 0,
            zoom: {
              value: (canvas?.viewportState?.zoom ?? 1) as unknown as AppState['zoom']['value'],
            },
            currentItemFontFamily: selectedFontFamily as AppState['currentItemFontFamily'],
            currentItemStrokeColor: defaultStrokeColor || tokenColors.text,
            currentItemBackgroundColor: 'transparent',
          },
        }}
        onChange={handleChange}
        theme="light"
        gridModeEnabled={false}
      />
    </div>
  );
}
