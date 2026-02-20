import { useEffect, useState, type ReactNode } from 'react';
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
                      onClick={openSidebar}
                      aria-label="Expand sidebar"
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
