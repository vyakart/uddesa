import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { PasskeyPrompt } from '@/components/common';
import { useContentLocking } from '@/hooks';
import { useAppStore } from '@/stores/appStore';
import type { TextBlock as TextBlockType } from '@/types/scratchpad';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface TextBlockProps {
  block: TextBlockType;
  isPageLocked?: boolean;
}

export function TextBlock({ block, isPageLocked = false }: TextBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [localContent, setLocalContent] = useState(block.content);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const blockStartPos = useRef({ x: 0, y: 0 });

  const updateTextBlock = useScratchpadStore((state) => state.updateTextBlock);
  const deleteTextBlock = useScratchpadStore((state) => state.deleteTextBlock);
  const closeDiary = useAppStore((state) => state.closeDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const hasPasskey = useSettingsStore((state) => state.hasPasskey);
  const passkeyHint = useSettingsStore((state) => state.global.passkeyHint);
  const {
    isLocked: isBlockLocked,
    lock,
    unlock,
    error: lockingError,
  } = useContentLocking({
    contentType: 'textBlock',
    contentId: block.id,
    enabled: true,
  });
  const isLocked = isPageLocked || isBlockLocked;

  // Focus on new blocks
  useEffect(() => {
    if (!isLocked && block.content === '' && contentRef.current) {
      contentRef.current.focus();
    }
  }, [block.content, isLocked]);

  const handleInput = useCallback(() => {
    if (contentRef.current && !isLocked) {
      const newContent = contentRef.current.innerText;
      setLocalContent(newContent);
    }
  }, [isLocked]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (isLocked) return;

    const trimmedContent = localContent.trim();

    if (trimmedContent === '') {
      // Delete empty blocks
      deleteTextBlock(block.id);
    } else if (trimmedContent !== block.content) {
      // Save changes
      updateTextBlock(block.id, { content: trimmedContent });
    }
  }, [localContent, block.id, block.content, deleteTextBlock, updateTextBlock, isLocked]);

  const handleFocus = useCallback(() => {
    setLocalContent(block.content);
    setIsFocused(true);
  }, [block.content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isLocked) {
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
    [block.content, isLocked]
  );

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;

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
    [block.position.x, block.position.y, isFocused, isLocked]
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

  const promptPasskeySetup = useCallback(() => {
    const shouldOpenSettings = confirm('A passkey is required to lock content. Open Settings to set one now?');
    if (shouldOpenSettings) {
      closeDiary();
      openSettings();
    }
  }, [closeDiary, openSettings]);

  const handleBlockLockToggle = useCallback(async () => {
    if (isPageLocked) {
      return;
    }

    if (isBlockLocked) {
      setShowUnlockPrompt(true);
      return;
    }

    const hasPass = await hasPasskey();
    if (!hasPass) {
      promptPasskeySetup();
      return;
    }

    await lock();
  }, [hasPasskey, isBlockLocked, isPageLocked, lock, promptPasskeySetup]);

  const handleUnlockSubmit = useCallback(async (passkey: string) => {
    const didUnlock = await unlock(passkey);
    if (didUnlock) {
      setShowUnlockPrompt(false);
    }
  }, [unlock]);

  return (
    <div
      className="muwi-scratchpad-text-block"
      data-focused={isFocused ? 'true' : 'false'}
      data-dragging={isDragging ? 'true' : 'false'}
      data-locked={isLocked ? 'true' : 'false'}
      style={{
        left: `${block.position.x}px`,
        top: `${block.position.y}px`,
        width: block.width === 'auto' ? 'auto' : `${block.width}px`,
        minWidth: '40px',
        maxWidth: 'calc(100% - 40px)',
      }}
      onMouseDown={handleMouseDown}
    >
      {!isFocused && !isLocked && (
        <div className="muwi-scratchpad-text-block__drag-outline" aria-hidden="true" />
      )}

      {isLocked && (
        <div className="muwi-scratchpad-text-block__lock-indicator" data-testid="scratchpad-text-lock-indicator">
          <Lock size={14} aria-hidden="true" />
        </div>
      )}

      {!isPageLocked && (
        <button
          type="button"
          aria-label={isBlockLocked ? 'Unlock block' : 'Lock block'}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => void handleBlockLockToggle()}
          className="muwi-scratchpad-text-block__lock-toggle"
        >
          {isBlockLocked ? 'Unlock' : 'Lock'}
        </button>
      )}

      <div
        ref={contentRef}
        contentEditable={!isLocked}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="muwi-scratchpad-text-block__content"
        style={{
          fontSize: `${block.fontSize}px`,
          fontFamily: block.fontFamily,
          minHeight: '1.5em',
        }}
      >
        {isFocused ? localContent : block.content}
      </div>

      <PasskeyPrompt
        isOpen={showUnlockPrompt}
        onClose={() => setShowUnlockPrompt(false)}
        onSubmit={handleUnlockSubmit}
        title="Unlock text block"
        description="Enter your passkey to unlock this text block."
        hint={passkeyHint}
        error={lockingError}
        submitLabel="Unlock"
      />
    </div>
  );
}
