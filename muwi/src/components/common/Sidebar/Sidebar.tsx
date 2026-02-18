import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SidebarProps {
  title: string;
  isOpen: boolean;
  onBack?: () => void;
  onToggle?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  ariaLabel?: string;
}

interface SidebarItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: ReactNode;
  active?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Sidebar({
  title,
  isOpen,
  onBack,
  onToggle,
  header,
  footer,
  children,
  ariaLabel,
}: SidebarProps) {
  return (
    <div className="muwi-sidebar-shell" data-open={isOpen ? 'true' : 'false'} data-testid="shared-sidebar-shell">
      <aside
        className="muwi-sidebar"
        role="navigation"
        aria-label={ariaLabel ?? `${title} Navigation`}
        aria-hidden={!isOpen}
      >
        <div className="muwi-sidebar__header">
          <button
            type="button"
            onClick={onBack}
            className="muwi-sidebar-button"
            aria-label="Back to shelf"
          >
            ←
          </button>
          <span className="muwi-sidebar__title">{title}</span>
          <button
            type="button"
            onClick={onToggle}
            className="muwi-sidebar-button"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>
        {header ? <div className="muwi-sidebar__slot">{header}</div> : null}
        <div className="muwi-sidebar__body">{children}</div>
        {footer ? <div className="muwi-sidebar__footer">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function SidebarItem({
  label,
  active = false,
  leading,
  trailing,
  className,
  type = 'button',
  ...buttonProps
}: SidebarItemProps) {
  const classes = ['muwi-sidebar-item', active ? 'is-active' : null, className ?? null]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...buttonProps}>
      {leading}
      <span className="muwi-sidebar-item__label">{label}</span>
      {trailing}
    </button>
  );
}
