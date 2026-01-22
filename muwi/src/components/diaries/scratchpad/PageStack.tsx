import { useScratchpadStore } from '@/stores/scratchpadStore';

export function PageStack() {
  const pages = useScratchpadStore((state) => state.pages);
  const currentPageIndex = useScratchpadStore((state) => state.currentPageIndex);
  const textBlocks = useScratchpadStore((state) => state.textBlocks);
  const navigateToPage = useScratchpadStore((state) => state.navigateToPage);

  console.log('[PageStack] Rendering', { pagesCount: pages.length, currentPageIndex });

  return (
    <div className="flex flex-col gap-1 p-2 w-12">
      {pages.map((page, index) => {
        const hasContent = (textBlocks.get(page.id)?.length ?? 0) > 0;
        const isCurrent = index === currentPageIndex;

        return (
          <button
            key={page.id}
            onClick={() => navigateToPage(index)}
            className={`
              w-6 h-8 rounded-sm border transition-all duration-150
              relative group
              ${isCurrent
                ? 'border-gray-600 shadow-md scale-110'
                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
              }
            `}
            style={{
              backgroundColor: page.categoryColor,
              opacity: hasContent ? 1 : 0.5,
            }}
            title={`Page ${page.pageNumber}${hasContent ? ' (has content)' : ''}`}
          >
            {/* Current page indicator */}
            {isCurrent && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />
            )}

            {/* Content indicator dot */}
            {hasContent && (
              <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-gray-600 rounded-full" />
            )}

            {/* Lock indicator */}
            {page.isLocked && (
              <div className="absolute top-0.5 right-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 text-gray-600"
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
            )}

            {/* Tooltip on hover */}
            <div className="
              absolute right-full mr-2 top-1/2 -translate-y-1/2
              px-2 py-1 bg-gray-800 text-white text-xs rounded
              opacity-0 group-hover:opacity-100 pointer-events-none
              whitespace-nowrap transition-opacity
            ">
              Page {page.pageNumber}
            </div>
          </button>
        );
      })}
    </div>
  );
}
