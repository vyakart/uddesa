import { useCallback, useRef } from 'react';
import type { ScratchpadPage as ScratchpadPageType, TextBlock as TextBlockType } from '@/types/scratchpad';
import { defaultScratchpadSettings } from '@/types/scratchpad';
import { TextBlock } from './TextBlock';
import { useScratchpadStore } from '@/stores/scratchpadStore';

interface ScratchpadPageProps {
  page: ScratchpadPageType;
  blocks: TextBlockType[];
}

export function ScratchpadPage({ page, blocks }: ScratchpadPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const createTextBlock = useScratchpadStore((state) => state.createTextBlock);

  const { pageSize } = defaultScratchpadSettings;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only create block if clicking directly on the page (not on an existing block)
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

  console.log('[ScratchpadPage] Rendering', {
    pageId: page.id,
    pageSize,
    blocksCount: blocks.length,
    categoryColor: page.categoryColor,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        width: '100%',
        minHeight: pageSize.height + 64,
      }}
    >
      {/* Page with shadow wrapper */}
      <div
        style={{
          position: 'relative',
          width: pageSize.width + 8,
          height: pageSize.height + 8,
        }}
      >
        {/* Page shadow/depth effect */}
        <div
          style={{
            position: 'absolute',
            width: pageSize.width,
            height: pageSize.height,
            backgroundColor: '#d4d4d4',
            top: 4,
            left: 4,
            borderRadius: '4px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: pageSize.width,
            height: pageSize.height,
            backgroundColor: '#e0e0e0',
            top: 2,
            left: 2,
            borderRadius: '4px',
          }}
        />

        {/* Main page */}
        <div
          ref={containerRef}
          onClick={handleClick}
          style={{
            position: 'relative',
            width: pageSize.width,
            height: pageSize.height,
            backgroundColor: page.categoryColor,
            border: '2px solid #999',
            borderRadius: '4px',
            overflow: 'hidden',
            cursor: page.isLocked ? 'not-allowed' : 'text',
          }}
        >
          {/* Subtle paper texture overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              opacity: 0.3,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Text blocks */}
          {blocks.map((block) => (
            <TextBlock key={block.id} block={block} isPageLocked={page.isLocked} />
          ))}

          {/* Empty state hint */}
          {blocks.length === 0 && !page.isLocked && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <p style={{ color: '#999', fontSize: '0.875rem' }}>Click anywhere to start writing</p>
            </div>
          )}

          {/* Locked overlay */}
          {page.isLocked && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  padding: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '24px', height: '24px', color: '#888' }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
