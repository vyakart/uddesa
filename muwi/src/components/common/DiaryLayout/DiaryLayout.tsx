import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { DIARY_INFO } from '@/components/shelf/DiaryCard';
import { RightPanel } from '@/components/common/RightPanel';
import { Sidebar } from '@/components/common/Sidebar';
import { StatusBar } from '@/components/common/StatusBar';
import { TitleBar } from '@/components/common/TitleBar';

interface DiaryLayoutProps {
  children?: ReactNode;
  diaryType: DiaryType;
  showToolbar?: boolean;
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  canvas?: ReactNode;
  status?: ReactNode | { left?: ReactNode; right?: ReactNode };
  rightPanel?: ReactNode;
  rightPanelTitle?: string;
  onRightPanelBack?: () => void;
  rightPanelBackLabel?: string;
}

const PANEL_TITLE_MAP: Record<string, string> = {
  outline: 'Outline',
  bibliography: 'Bibliography',
  'reference-library': 'Reference Library',
  export: 'Export',
  backup: 'Backup',
  'document-settings': 'Document Settings',
};

const BREAKPOINT_OVERLAY = 800;
const BREAKPOINT_COMPACT = 960;
const BREAKPOINT_WIDE = 1200;
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type ShellBreakpoint = 'overlay' | 'compact' | 'standard' | 'wide';

function resolveShellBreakpoint(width: number): ShellBreakpoint {
  if (width < BREAKPOINT_OVERLAY) {
    return 'overlay';
  }

  if (width < BREAKPOINT_COMPACT) {
    return 'compact';
  }

  if (width < BREAKPOINT_WIDE) {
    return 'standard';
  }

  return 'wide';
}

function getInitialShellBreakpoint(): ShellBreakpoint {
  if (typeof window === 'undefined') {
    return 'wide';
  }

  return resolveShellBreakpoint(window.innerWidth);
}

function isStatusSlots(
  status: DiaryLayoutProps['status']
): status is { left?: ReactNode; right?: ReactNode } {
  return (
    typeof status === 'object' &&
    status !== null &&
    !Array.isArray(status) &&
    ('left' in status || 'right' in status)
  );
}

export function DiaryLayout({
  children,
  diaryType,
  showToolbar = true,
  toolbar,
  sidebar,
  sidebarHeader,
  sidebarFooter,
  canvas,
  status,
  rightPanel,
  rightPanelTitle,
  onRightPanelBack,
  rightPanelBackLabel,
}: DiaryLayoutProps) {
  const closeDiary = useAppStore((state) => state.closeDiary);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const openSidebar = useAppStore((state) => state.openSidebar);
  const closeSidebar = useAppStore((state) => state.closeSidebar);
  const rightPanelState = useAppStore((state) => state.rightPanel);
  const closeRightPanel = useAppStore((state) => state.closeRightPanel);
  const info = DIARY_INFO[diaryType];
  const hasSidebar = Boolean(sidebar);
  const hasRightPanel = Boolean(rightPanel);
  const renderCanvas = canvas ?? children;
  const hasStatus = status !== undefined && status !== null;
  const statusSlots = isStatusSlots(status) ? status : { left: status };
  const [shellBreakpoint, setShellBreakpoint] = useState<ShellBreakpoint>(getInitialShellBreakpoint);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const overlayReturnFocusRef = useRef<HTMLElement | null>(null);
  const isSidebarOverlay = shellBreakpoint === 'overlay';
  const shouldAutoCollapseSidebar = shellBreakpoint === 'compact';
  const computedRightPanelTitle =
    rightPanelTitle ??
    (rightPanelState.panelType ? PANEL_TITLE_MAP[rightPanelState.panelType] ?? rightPanelState.panelType : 'Panel');

  useEffect(() => {
    const handleResize = () => {
      const nextBreakpoint = resolveShellBreakpoint(window.innerWidth);
      setShellBreakpoint((current) => (current === nextBreakpoint ? current : nextBreakpoint));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!shouldAutoCollapseSidebar || !rightPanelState.isOpen || !isSidebarOpen) {
      return;
    }

    closeSidebar();
  }, [shouldAutoCollapseSidebar, rightPanelState.isOpen, isSidebarOpen, closeSidebar]);

  useEffect(() => {
    if (!hasSidebar || !isSidebarOverlay || !isSidebarOpen) {
      return;
    }

    const sidebarNode = sidebarRef.current;
    if (!sidebarNode) {
      return;
    }

    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (
      overlayReturnFocusRef.current == null &&
      (!activeElement || !sidebarNode.contains(activeElement))
    ) {
      overlayReturnFocusRef.current = activeElement;
    }

    const focusables = sidebarNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables[0] ?? sidebarNode).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSidebar();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const nodes = sidebarNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) {
        event.preventDefault();
        sidebarNode.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const focusedElement = document.activeElement as HTMLElement | null;

      if (!focusedElement || !sidebarNode.contains(focusedElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (!event.shiftKey && focusedElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && focusedElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);

      const focusTarget = overlayReturnFocusRef.current;
      const fallbackFocusTarget = document.querySelector<HTMLElement>(
        '[data-testid="diary-sidebar-open-button"]'
      );
      const nextFocusTarget =
        focusTarget && document.contains(focusTarget) ? focusTarget : fallbackFocusTarget;
      if (nextFocusTarget && document.contains(nextFocusTarget)) {
        nextFocusTarget.focus();
      }
      overlayReturnFocusRef.current = null;
    };
  }, [closeSidebar, hasSidebar, isSidebarOpen, isSidebarOverlay]);

  return (
    <div className="muwi-diary-layout" data-diary-type={diaryType}>
      <TitleBar contextLabel={info.name} />

      <div
        className="muwi-shell"
        data-shell-breakpoint={shellBreakpoint}
        data-sidebar-overlay={isSidebarOverlay ? 'true' : 'false'}
        data-testid="diary-shell"
      >
        {hasSidebar ? (
          <Sidebar
            title={info.name}
            isOpen={isSidebarOpen}
            onBack={closeDiary}
            onToggle={isSidebarOpen ? closeSidebar : openSidebar}
            header={sidebarHeader}
            footer={sidebarFooter}
            asideRef={sidebarRef}
          >
            {sidebar}
          </Sidebar>
        ) : null}
        {hasSidebar && isSidebarOverlay && isSidebarOpen ? (
          <button
            type="button"
            className="muwi-shell-sidebar-backdrop"
            onClick={closeSidebar}
            aria-label="Close sidebar overlay"
            data-testid="sidebar-overlay-backdrop"
          />
        ) : null}

        <section className="muwi-shell-center">
          {showToolbar ? (
            <div className="muwi-shell-toolbar">
              <div className="muwi-shell-toolbar__leading">
                {hasSidebar ? (
                  !isSidebarOpen ? (
                    <button
                      type="button"
                      className="muwi-sidebar-button"
                      onClick={(event) => {
                        overlayReturnFocusRef.current = event.currentTarget;
                        openSidebar();
                      }}
                      aria-label="Expand sidebar"
                      data-testid="diary-sidebar-open-button"
                    >
                      ▶
                    </button>
                  ) : null
                ) : (
                  <button
                    type="button"
                    className="muwi-sidebar-button"
                    onClick={closeDiary}
                    aria-label="Back to shelf"
                  >
                    ←
                  </button>
                )}
              </div>
              <div className="muwi-shell-toolbar__content">{toolbar}</div>
            </div>
          ) : null}

          <main className="muwi-shell-canvas-region">
            {!showToolbar && !hasSidebar ? (
              <div className="muwi-shell-floating-controls">
                <button
                  type="button"
                  className="muwi-sidebar-button"
                  onClick={closeDiary}
                  aria-label="Back to shelf"
                >
                  ←
                </button>
              </div>
            ) : null}

            <div
              className="muwi-shell-canvas-inner"
              data-constrained={diaryType === 'blackboard' ? 'false' : 'true'}
            >
              <div className="muwi-shell-canvas-slot">{renderCanvas}</div>
            </div>
          </main>

          {hasStatus ? <StatusBar left={statusSlots.left} right={statusSlots.right} /> : null}
        </section>

        {hasRightPanel && rightPanelState.isOpen ? (
          <RightPanel
            isOpen={rightPanelState.isOpen}
            title={computedRightPanelTitle}
            onClose={closeRightPanel}
            onBack={onRightPanelBack}
            backLabel={rightPanelBackLabel}
          >
            {rightPanel}
          </RightPanel>
        ) : null}
      </div>
    </div>
  );
}
