import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Lock, NotebookPen } from 'lucide-react';
import type { ScratchpadPage as ScratchpadPageType, TextBlock as TextBlockType } from '@/types/scratchpad';
import { Button } from '@/components/common';
import { TextBlock } from './TextBlock';
import { useScratchpadStore } from '@/stores/scratchpadStore';

interface ScratchpadPageProps {
  page: ScratchpadPageType;
  blocks: TextBlockType[];
}

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 600;

export function ScratchpadPage({ page, blocks }: ScratchpadPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const createTextBlock = useScratchpadStore((state) => state.createTextBlock);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return;
      if (page.isLocked) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createTextBlock(page.id, { x, y });
    },
    [page.id, page.isLocked, createTextBlock]
  );

  const handleCreateFirstBlock = useCallback(() => {
    if (page.isLocked) {
      return;
    }

    void createTextBlock(page.id, {
      x: Math.round(PAGE_WIDTH * 0.25),
      y: Math.round(PAGE_HEIGHT * 0.28),
    });
  }, [createTextBlock, page.id, page.isLocked]);

  return (
    <div className="muwi-scratchpad-page">
      <div className="muwi-scratchpad-page__stack">
        <div
          data-testid="scratchpad-page-shadow-1"
          className="muwi-scratchpad-page__shadow is-depth-1"
        />
        <div
          data-testid="scratchpad-page-shadow-2"
          className="muwi-scratchpad-page__shadow is-depth-2"
        />

        <div
          data-testid="scratchpad-page-canvas"
          ref={containerRef}
          onClick={handleClick}
          className="muwi-scratchpad-page__canvas"
          data-category={page.categoryName}
          data-page-size="400x600"
          data-locked={page.isLocked ? 'true' : 'false'}
          style={{ '--muwi-scratchpad-page-color': page.categoryColor } as CSSProperties}
        >
          <div className="muwi-scratchpad-page__texture" aria-hidden="true" />

          {blocks.map((block) => (
            <TextBlock key={block.id} block={block} isPageLocked={page.isLocked} />
          ))}

          {blocks.length === 0 && !page.isLocked && (
            <div className="muwi-scratchpad-page__empty" role="status">
              <NotebookPen size={22} aria-hidden="true" className="muwi-scratchpad-page__empty-icon" />
              <h3 className="muwi-scratchpad-page__empty-title">Start this page</h3>
              <p className="muwi-scratchpad-page__empty-text">
                Capture a thought, task, or question by placing your first text block.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="muwi-scratchpad-page__empty-action"
                onClick={handleCreateFirstBlock}
              >
                Add first text block
              </Button>
            </div>
          )}

          {page.isLocked && (
            <div className="muwi-scratchpad-page__locked-overlay" role="img" aria-label="Page is locked">
              <Lock size={24} aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
