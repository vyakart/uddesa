import type { ReactNode } from 'react';

interface RightPanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
}

export function RightPanel({
  isOpen,
  title,
  onClose,
  onBack,
  backLabel = 'Back',
  children,
}: RightPanelProps) {
  return (
    <aside
      className="muwi-right-panel"
      data-open={isOpen ? 'true' : 'false'}
      aria-hidden={!isOpen}
      role="complementary"
      aria-label={`${title} panel`}
    >
      <div className="muwi-right-panel__header">
        {onBack ? (
          <button type="button" onClick={onBack} className="muwi-sidebar-button" aria-label={backLabel}>
            ←
          </button>
        ) : (
          <span />
        )}

        <h2 className="muwi-right-panel__title">{title}</h2>

        <button
          type="button"
          onClick={onClose}
          className="muwi-sidebar-button"
          aria-label="Close right panel"
        >
          ×
        </button>
      </div>
      <div className="muwi-right-panel__body">{children}</div>
    </aside>
  );
}
