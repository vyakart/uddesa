import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextBlock as TextBlockType } from '@/types/scratchpad';
import { useScratchpadStore } from '@/stores/scratchpadStore';

interface TextBlockProps {
  block: TextBlockType;
  isPageLocked?: boolean;
}

export function TextBlock({ block, isPageLocked = false }: TextBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const blockStartPos = useRef({ x: 0, y: 0 });

  const updateTextBlock = useScratchpadStore((state) => state.updateTextBlock);
  const deleteTextBlock = useScratchpadStore((state) => state.deleteTextBlock);

  // Focus on new blocks
  useEffect(() => {
    if (block.content === '' && contentRef.current) {
      contentRef.current.focus();
    }
  }, [block.content]);

  const handleInput = useCallback(() => {
    if (contentRef.current && !isPageLocked) {
      const newContent = contentRef.current.innerText;
      setLocalContent(newContent);
    }
  }, [isPageLocked]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (isPageLocked) return;

    const trimmedContent = localContent.trim();

    if (trimmedContent === '') {
      // Delete empty blocks
      deleteTextBlock(block.id);
    } else if (trimmedContent !== block.content) {
      // Save changes
      updateTextBlock(block.id, { content: trimmedContent });
    }
  }, [localContent, block.id, block.content, deleteTextBlock, updateTextBlock, isPageLocked]);

  const handleFocus = useCallback(() => {
    setLocalContent(block.content);
    setIsFocused(true);
  }, [block.content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPageLocked) {
        e.preventDefault();
        return;
      }

      // Tab to unfocus
      if (e.key === 'Tab') {
        e.preventDefault();
        contentRef.current?.blur();
      }

      // Escape to cancel and blur
      if (e.key === 'Escape') {
        setLocalContent(block.content);
        if (contentRef.current) {
          contentRef.current.innerText = block.content;
        }
        contentRef.current?.blur();
      }
    },
    [block.content, isPageLocked]
  );

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPageLocked) return;

      // Only start drag from the edges (first/last 8px)
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const isOnEdge =
        e.clientX - rect.left < 8 ||
        rect.right - e.clientX < 8 ||
        e.clientY - rect.top < 8 ||
        rect.bottom - e.clientY < 8;

      if (isOnEdge && !isFocused) {
        e.preventDefault();
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        blockStartPos.current = { x: block.position.x, y: block.position.y };
      }
    },
    [block.position.x, block.position.y, isFocused, isPageLocked]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = Math.max(0, blockStartPos.current.x + deltaX);
      const newY = Math.max(0, blockStartPos.current.y + deltaY);

      updateTextBlock(block.id, {
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, block.id, updateTextBlock]);

  const isLocked = isPageLocked || false;

  return (
    <div
      className={`
        absolute group
        ${isDragging ? 'cursor-grabbing' : 'cursor-text'}
        ${isFocused ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${isDragging ? 'opacity-80' : ''}
      `}
      style={{
        left: `${block.position.x}px`,
        top: `${block.position.y}px`,
        width: block.width === 'auto' ? 'auto' : `${block.width}px`,
        minWidth: '40px',
        maxWidth: 'calc(100% - 40px)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle indicator on hover */}
      {!isFocused && !isLocked && (
        <div className="absolute -left-1 -top-1 -right-1 -bottom-1 border-2 border-transparent group-hover:border-gray-300 group-hover:border-dashed rounded pointer-events-none" />
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute -right-6 top-0 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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

      {/* Content editable area */}
      <div
        ref={contentRef}
        contentEditable={!isLocked}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`
          outline-none px-2 py-1 rounded
          whitespace-pre-wrap break-words
          ${isLocked ? 'cursor-not-allowed opacity-75' : ''}
        `}
        style={{
          fontSize: `${block.fontSize}px`,
          fontFamily: block.fontFamily,
          minHeight: '1.5em',
        }}
      >
        {isFocused ? localContent : block.content}
      </div>
    </div>
  );
}
