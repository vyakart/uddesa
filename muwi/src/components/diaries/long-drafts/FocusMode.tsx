import { useEffect, useCallback, useState, useRef } from 'react';
import { useLongDraftsStore, selectViewMode, selectCurrentSection } from '@/stores/longDraftsStore';

interface FocusModeProps {
  children: React.ReactNode;
}

export function FocusMode({ children }: FocusModeProps) {
  const viewMode = useLongDraftsStore(selectViewMode);
  const currentSection = useLongDraftsStore(selectCurrentSection);
  const toggleFocusMode = useLongDraftsStore((state) => state.toggleFocusMode);

  const [showControls, setShowControls] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(viewMode === 'focus');
  const [isOverlayActive, setIsOverlayActive] = useState(viewMode === 'focus');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFocusMode = viewMode === 'focus';
  const controlsVisible = isFocusMode && showControls;

  // Handle keyboard shortcut (Escape to exit focus mode, F11 to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key exits focus mode
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
      // F11 or Cmd/Ctrl+Shift+F toggles focus mode
      if ((e.key === 'F11' || (e.key.toLowerCase() === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey))) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  // Show/hide controls on mouse move in focus mode
  const handleMouseMove = useCallback(() => {
    if (!isFocusMode) return;

    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, [isFocusMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (exitAnimationTimeoutRef.current) {
        clearTimeout(exitAnimationTimeoutRef.current);
      }
    };
  }, []);

  // Animate overlay enter/exit
  useEffect(() => {
    let rafId: number | null = null;
    let nestedRafId: number | null = null;

    if (isFocusMode) {
      if (exitAnimationTimeoutRef.current) {
        clearTimeout(exitAnimationTimeoutRef.current);
      }

      rafId = requestAnimationFrame(() => {
        setIsOverlayVisible(true);
        nestedRafId = requestAnimationFrame(() => {
          setIsOverlayActive(true);
        });
      });

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        if (nestedRafId !== null) {
          cancelAnimationFrame(nestedRafId);
        }
      };
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    rafId = requestAnimationFrame(() => {
      setShowControls(false);
      setIsOverlayActive(false);
    });

    if (isOverlayVisible) {
      exitAnimationTimeoutRef.current = setTimeout(() => {
        setIsOverlayVisible(false);
      }, 220);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (exitAnimationTimeoutRef.current) {
        clearTimeout(exitAnimationTimeoutRef.current);
      }
    };
  }, [isFocusMode, isOverlayVisible]);

  if (!isOverlayVisible) {
    return <>{children}</>;
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-bg-paper)',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOverlayActive ? 1 : 0,
        transform: isOverlayActive ? 'scale(1)' : 'scale(0.995)',
        transition: 'opacity 220ms ease, transform 220ms ease',
        pointerEvents: isOverlayActive ? 'auto' : 'none',
        willChange: 'opacity, transform',
      }}
    >
      {/* Top controls bar - fades in on mouse move */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-paper)',
          borderBottom: '1px solid var(--color-border-default)',
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          pointerEvents: controlsVisible ? 'auto' : 'none',
          zIndex: 10,
        }}
      >
        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-secondary)"
            strokeWidth="2"
          >
            <path d="M15 3h6v6M14 10l7-7M10 3H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6" />
          </svg>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {currentSection?.title || 'Untitled Section'}
          </span>
        </div>

        {/* Exit button */}
        <button
          onClick={toggleFocusMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border-default)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Exit Focus Mode
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginLeft: '4px',
            }}
          >
            (Esc)
          </span>
        </button>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>

      {/* Bottom hint - always visible but subtle */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          backgroundColor: 'var(--color-bg-paper)',
          borderRadius: '20px',
          opacity: controlsVisible ? 0 : 0.6,
          transition: 'opacity 300ms ease',
          pointerEvents: 'none',
        }}
      >
        Move mouse to show controls • Press Esc to exit
      </div>
    </div>
  );
}

// Focus mode toggle button for use in toolbars
export function FocusModeToggle() {
  const viewMode = useLongDraftsStore(selectViewMode);
  const toggleFocusMode = useLongDraftsStore((state) => state.toggleFocusMode);

  const isFocusMode = viewMode === 'focus';

  return (
    <button
      onClick={toggleFocusMode}
      title={isFocusMode ? 'Exit Focus Mode (Cmd+Shift+F)' : 'Enter Focus Mode (Cmd+Shift+F)'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        fontSize: '12px',
        color: isFocusMode ? 'var(--color-accent-default)' : 'var(--color-text-secondary)',
        backgroundColor: isFocusMode ? 'var(--color-accent-subtle)' : 'transparent',
        border: isFocusMode ? '1px solid var(--color-accent-default)' : '1px solid var(--color-border-default)',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isFocusMode) {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isFocusMode) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {isFocusMode ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
          </svg>
          Exit Focus
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
          </svg>
          Focus Mode
        </>
      )}
    </button>
  );
}
