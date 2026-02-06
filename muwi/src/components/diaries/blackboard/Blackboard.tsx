import { useEffect, useState, useCallback } from 'react';
import { DiaryLayout } from '@/components/common';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { ExcalidrawWrapper } from './ExcalidrawWrapper';
import { IndexPanel } from './IndexPanel';
import { BlackboardToolbar } from './BlackboardToolbar';

export function Blackboard() {
  const [isIndexVisible, setIsIndexVisible] = useState(true);
  const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isLoading = useBlackboardStore((state) => state.isLoading);
  const error = useBlackboardStore((state) => state.error);
  const loadCanvas = useBlackboardStore((state) => state.loadCanvas);
  const rebuildIndex = useBlackboardStore((state) => state.rebuildIndex);

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
      // Navigation to element would require Excalidraw API access
      // For now, this is a placeholder for future implementation
      void elementId;
      void position;
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
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ExcalidrawWrapper onElementsChange={handleElementsChange} />
        </div>
      </div>
    </DiaryLayout>
  );
}
