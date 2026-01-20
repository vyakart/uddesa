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

  return (
    <div className="relative flex items-center justify-center p-8">
      {/* Page shadow/depth effect */}
      <div
        className="absolute"
        style={{
          width: pageSize.width + 4,
          height: pageSize.height + 4,
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          transform: 'translate(4px, 4px)',
        }}
      />
      <div
        className="absolute"
        style={{
          width: pageSize.width + 2,
          height: pageSize.height + 2,
          backgroundColor: '#d0d0d0',
          borderRadius: '4px',
          transform: 'translate(2px, 2px)',
        }}
      />

      {/* Main page */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`
          relative overflow-hidden rounded cursor-text
          shadow-lg border border-gray-200
          ${page.isLocked ? 'cursor-not-allowed' : ''}
        `}
        style={{
          width: pageSize.width,
          height: pageSize.height,
          backgroundColor: page.categoryColor,
        }}
      >
        {/* Subtle paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Text blocks */}
        {blocks.map((block) => (
          <TextBlock
            key={block.id}
            block={block}
            isPageLocked={page.isLocked}
          />
        ))}

        {/* Empty state hint */}
        {blocks.length === 0 && !page.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Click anywhere to start writing</p>
          </div>
        )}

        {/* Locked overlay */}
        {page.isLocked && (
          <div className="absolute inset-0 bg-black bg-opacity-5 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-3 shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500"
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
  );
}
