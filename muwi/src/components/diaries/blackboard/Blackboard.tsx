import { useEffect, useState, useCallback, type MouseEvent } from 'react';
import { DiaryLayout, FontSelector } from '@/components/common';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { ExcalidrawWrapper } from './ExcalidrawWrapper';
import { IndexPanel } from './IndexPanel';
import { BlackboardToolbar } from './BlackboardToolbar';

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

  const isLoading = useBlackboardStore((state) => state.isLoading);
  const error = useBlackboardStore((state) => state.error);
  const canvas = useBlackboardStore((state) => state.canvas);
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

  // Show loading state during initialization
  if (!isInitialized || isLoading) {
    return (
      <DiaryLayout diaryType="blackboard">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#888888',
          }}
        >
          Loading...
        </div>
      </DiaryLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DiaryLayout diaryType="blackboard">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#F44336',
            gap: '16px',
          }}
        >
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: '1px solid #F44336',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#F44336',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </DiaryLayout>
    );
  }

  return (
    <DiaryLayout
      diaryType="blackboard"
      toolbar={
        <BlackboardToolbar
          isIndexVisible={isIndexVisible}
          onToggleIndex={handleToggleIndex}
        />
      }
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Index Panel */}
        {isIndexVisible && (
          <IndexPanel
            isCollapsed={isIndexCollapsed}
            onToggleCollapse={handleToggleCollapse}
            onNavigateToElement={handleNavigateToElement}
          />
        )}

        {/* Excalidraw Canvas */}
        <div
          data-testid="blackboard-canvas-container"
          onContextMenuCapture={handleCanvasContextMenu}
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ExcalidrawWrapper
            onElementsChange={handleElementsChange}
            navigationTarget={navigationTarget}
            onNavigationHandled={() => setNavigationTarget(null)}
          />
          {fontMenuPosition ? (
            <div
              role="presentation"
              style={{
                position: 'fixed',
                left: fontMenuPosition.x,
                top: fontMenuPosition.y,
                zIndex: 1200,
                backgroundColor: '#ffffff',
                border: '1px solid #d7d7d7',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                padding: 6,
              }}
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
      </div>
    </DiaryLayout>
  );
}
