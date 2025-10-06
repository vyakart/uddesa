import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '../../../editors/excalidraw/Canvas';
import { centerOn } from '../../../editors/excalidraw/excalApi';
import { OutlinePanel, type OutlineItem } from '../../../ui/OutlinePanel';
import type { DiaryScreenProps } from '../types';
import { useBlackboard } from './useBlackboard';
import { useOutline } from './useOutline';

export function BlackboardView({ diary }: DiaryScreenProps) {
  const { scene, pageId, isLoading, error, updateScene } = useBlackboard(diary);
  const outlineItems = useOutline(scene);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);

  useEffect(() => {
    if (outlineItems.length === 0) {
      setActiveOutlineId(null);
      return;
    }
    setActiveOutlineId((current) => {
      if (current && outlineItems.some((item) => item.id === current)) {
        return current;
      }
      return outlineItems[0].id;
    });
  }, [outlineItems]);

  const handleOutlineSelect = useCallback((item: OutlineItem) => {
    setActiveOutlineId(item.id);
    centerOn({ elementId: item.id, bounds: item.bounds ?? undefined });
  }, []);

  return (
    <div className="blackboard">
      <aside className="blackboard__sidebar">
        <OutlinePanel items={outlineItems} activeId={activeOutlineId} onSelect={handleOutlineSelect} />
      </aside>
      <section className="blackboard__workspace">
        {isLoading && !scene ? (
          <div className="blackboard__status">Loading board…</div>
        ) : error ? (
          <div className="blackboard__status blackboard__status--error">{error}</div>
        ) : scene ? (
          <Canvas
            pageKey={pageId ?? `blackboard-${diary.id}`}
            scene={scene}
            onSceneChange={updateScene}
            className="blackboard__canvas"
          />
        ) : (
          <div className="blackboard__status">Blackboard unavailable.</div>
        )}
      </section>
    </div>
  );
}
