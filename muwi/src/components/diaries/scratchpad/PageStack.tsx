import { useScratchpadStore } from '@/stores/scratchpadStore';
import type { CSSProperties } from 'react';

export function PageStack() {
  const pages = useScratchpadStore((state) => state.pages);
  const currentPageIndex = useScratchpadStore((state) => state.currentPageIndex);
  const navigateToPage = useScratchpadStore((state) => state.navigateToPage);

  return (
    <div className="muwi-scratchpad-stack">
      {pages.map((page, index) => {
        const hasContent = page.textBlockIds.length > 0;
        const isCurrent = index === currentPageIndex;

        return (
          <button
            key={page.id}
            type="button"
            onClick={() => navigateToPage(index)}
            className="muwi-scratchpad-stack__item"
            data-active={isCurrent ? 'true' : 'false'}
            data-has-content={hasContent ? 'true' : 'false'}
            data-locked={page.isLocked ? 'true' : 'false'}
            aria-current={isCurrent ? 'page' : undefined}
            title={`Page ${page.pageNumber}${hasContent ? ' (has content)' : ''}`}
          >
            <span
              className="muwi-scratchpad-stack__dot"
              style={{ '--muwi-page-dot': page.categoryColor } as CSSProperties}
              aria-hidden="true"
            />
            <span className="muwi-scratchpad-stack__label">Page {page.pageNumber}</span>
            <span className="muwi-scratchpad-stack__meta">
              {page.textBlockIds.length} {page.textBlockIds.length === 1 ? 'block' : 'blocks'}
            </span>
            {page.isLocked ? (
              <span className="muwi-scratchpad-stack__lock" aria-label="Locked">
                Locked
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
