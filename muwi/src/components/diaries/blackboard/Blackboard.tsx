import { lazy, Suspense, useEffect, useState, useCallback, useRef, type MouseEvent } from 'react';
import { Presentation } from 'lucide-react';
import { Button, DiaryLayout, FontSelector } from '@/components/common';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { IndexPanel } from './IndexPanel';
import { BlackboardToolbar } from './BlackboardToolbar';

const ExcalidrawWrapper = lazy(async () => {
  const module = await import('./ExcalidrawWrapper');
  return { default: module.ExcalidrawWrapper };
});

export function Blackboard() {
  const [isIndexVisible, setIsIndexVisible] = useState(true);
  const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<{
    elementId: string;
    position: { x: number; y: number };
    requestedAt: number;
  } | null>(null);
  const [fontMenuPosition, setFontMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const isLoading = useBlackboardStore((state) => state.isLoading);
  const error = useBlackboardStore((state) => state.error);
  const canvas = useBlackboardStore((state) => state.canvas);
  const index = useBlackboardStore((state) => state.index);
  const elements = useBlackboardStore((state) => state.elements);
  const loadCanvas = useBlackboardStore((state) => state.loadCanvas);
  const rebuildIndex = useBlackboardStore((state) => state.rebuildIndex);
  const updateSettings = useBlackboardStore((state) => state.updateSettings);

  // Initialize: load canvas on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadCanvas();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Blackboard:', err);
        setIsInitialized(true);
      }
    };
    initialize();
  }, [loadCanvas]);

  // Handle navigation to an element from the index panel
  const handleNavigateToElement = useCallback(
    (elementId: string, position: { x: number; y: number }) => {
      setNavigationTarget({
        elementId,
        position,
        requestedAt: Date.now(),
      });
    },
    []
  );

  // Handle element changes from Excalidraw
  const handleElementsChange = useCallback(() => {
    // Rebuild index when elements change
    rebuildIndex();
  }, [rebuildIndex]);

  const handleToggleIndex = () => {
    if (isIndexVisible && !isIndexCollapsed) {
      setIsIndexCollapsed(true);
    } else if (isIndexVisible && isIndexCollapsed) {
      setIsIndexVisible(false);
    } else {
      setIsIndexVisible(true);
      setIsIndexCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    setIsIndexCollapsed(!isIndexCollapsed);
  };

  const handleCanvasContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setFontMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleFontSelected = useCallback(
    async (font: string) => {
      await updateSettings({ defaultFont: font });
      setFontMenuPosition(null);
    },
    [updateSettings]
  );

  useEffect(() => {
    if (!fontMenuPosition) {
      return;
    }

    const handleOutsideClick = () => {
      setFontMenuPosition(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFontMenuPosition(null);
      }
    };

    window.addEventListener('pointerdown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [fontMenuPosition]);

  const isBusy = !isInitialized || isLoading;
  const elementCount = elements.filter((element) => (element as { isDeleted?: boolean }).isDeleted !== true).length;
  const isEmptyCanvas = !isBusy && !error && elementCount === 0;
  const zoomPercent = Math.max(1, Math.round((canvas?.viewportState.zoom ?? 1) * 100));
  const status = isBusy
    ? { left: 'Loading blackboard...', right: 'Syncing canvas state' }
    : error
      ? { left: 'Blackboard unavailable', right: 'Reload to retry' }
      : {
          left: `Zoom: ${zoomPercent}%`,
          right: `${index.length} heading${index.length === 1 ? '' : 's'} · ${elementCount} element${elementCount === 1 ? '' : 's'}`,
        };

  const handleEmptyStateAction = useCallback(() => {
    canvasContainerRef.current?.focus();
  }, []);

  const rightPanel = (
    <div data-testid="blackboard-right-panel" className="muwi-blackboard-panel">
      <div>
        <p className="muwi-blackboard-panel__label">Blackboard</p>
        <h3 className="muwi-blackboard-panel__title">{canvas?.name ?? 'Untitled Canvas'}</h3>
      </div>
      <p className="muwi-blackboard-panel__meta">
        {index.length} heading{index.length === 1 ? '' : 's'} indexed.
      </p>
      {index.length === 0 ? (
        <p className="muwi-blackboard-panel__hint">
          Add text starting with #, ##, or ### on the canvas to build quick navigation links.
        </p>
      ) : (
        <div className="muwi-blackboard-panel__list">
          {index.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleNavigateToElement(entry.elementId, entry.position)}
              className="muwi-blackboard-panel__item"
              title={entry.title}
            >
              {entry.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const toolbar = (
    <BlackboardToolbar
      isIndexVisible={isIndexVisible}
      onToggleIndex={handleToggleIndex}
    />
  );

  const sidebar = isIndexVisible ? (
    <IndexPanel
      isCollapsed={isIndexCollapsed}
      onToggleCollapse={handleToggleCollapse}
      onNavigateToElement={handleNavigateToElement}
    />
  ) : null;

  const loadingCanvas = (
    <div className="muwi-blackboard-canvas__message">
      Loading blackboard...
    </div>
  );

  const errorCanvas = (
    <div className="muwi-blackboard-canvas__message is-error">
      <p>Error: {error}</p>
      <Button type="button" onClick={() => window.location.reload()} variant="danger" size="sm">
        Reload
      </Button>
    </div>
  );

  const canvasSlot = isBusy ? loadingCanvas : error ? errorCanvas : (
    <div
      data-testid="blackboard-canvas-container"
      onContextMenuCapture={handleCanvasContextMenu}
      className="muwi-blackboard-canvas"
      ref={canvasContainerRef}
      tabIndex={-1}
    >
      <Suspense fallback={<div className="muwi-blackboard-canvas__message">Loading canvas engine...</div>}>
        <ExcalidrawWrapper
          onElementsChange={handleElementsChange}
          navigationTarget={navigationTarget}
          onNavigationHandled={() => setNavigationTarget(null)}
        />
      </Suspense>
      {isEmptyCanvas ? (
        <div className="muwi-blackboard-state" role="status" aria-live="polite">
          <span className="muwi-blackboard-state__icon" aria-hidden="true">
            <Presentation size={20} />
          </span>
          <p className="muwi-blackboard-state__title">Blank canvas</p>
          <p className="muwi-blackboard-state__text">Think visually — sketch, connect, map</p>
          <Button type="button" onClick={handleEmptyStateAction} variant="primary" size="sm" className="muwi-blackboard-state__action">
            Click anywhere to start
          </Button>
        </div>
      ) : null}
      {fontMenuPosition ? (
        <div
          role="presentation"
          className="muwi-blackboard-font-menu"
          style={{ left: fontMenuPosition.x, top: fontMenuPosition.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <FontSelector
            variant="context-menu"
            fonts={canvas?.settings?.fonts ?? ['Inter', 'Caveat', 'JetBrains Mono', 'Crimson Pro']}
            value={canvas?.settings?.defaultFont ?? 'Inter'}
            onChange={(font) => {
              void handleFontSelected(font);
            }}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <DiaryLayout
      diaryType="blackboard"
      sidebar={sidebar}
      toolbar={toolbar}
      canvas={canvasSlot}
      status={status}
      rightPanel={rightPanel}
      rightPanelTitle="Index"
    />
  );
}
