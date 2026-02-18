export interface ToolbarButtonItem {
  type?: 'button';
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isActive?: boolean;
  tooltip?: string;
  toggle?: boolean;
  showLabel?: boolean;
}

export interface ToolbarSeparatorItem {
  type: 'separator';
  id: string;
}

export type ToolbarItem = ToolbarButtonItem | ToolbarSeparatorItem;

export interface ToolbarProps {
  items: ToolbarItem[];
  ariaLabel?: string;
}

function isSeparator(item: ToolbarItem): item is ToolbarSeparatorItem {
  return item.type === 'separator';
}

export function Toolbar({ items, ariaLabel = 'Toolbar' }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className="muwi-toolbar"
      onKeyDown={(event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
          return;
        }

        const toolbar = event.currentTarget as HTMLDivElement;
        const enabledButtons = Array.from(
          toolbar.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
        );

        if (enabledButtons.length === 0) {
          return;
        }

        const activeElement = document.activeElement as HTMLButtonElement | null;
        const currentIndex = enabledButtons.findIndex((button) => button === activeElement);
        const startIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex =
          event.key === 'ArrowRight'
            ? (startIndex + 1) % enabledButtons.length
            : (startIndex - 1 + enabledButtons.length) % enabledButtons.length;

        event.preventDefault();
        enabledButtons[nextIndex].focus();
      }}
    >
      {items.map((item) => {
        if (isSeparator(item)) {
          return (
            <div
              key={item.id}
              role="separator"
              aria-orientation="vertical"
              className="muwi-toolbar__separator"
            />
          );
        }

        const isPressed = Boolean(item.toggle && item.isActive);
        const showLabel = item.showLabel || !item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.tooltip}
            aria-label={item.label}
            aria-pressed={item.toggle ? isPressed : undefined}
            data-active={item.isActive ? 'true' : 'false'}
            data-icon-only={!showLabel ? 'true' : 'false'}
            className="muwi-toolbar__button"
          >
            {item.icon ? <span className="muwi-toolbar__icon" aria-hidden="true">{item.icon}</span> : null}
            {showLabel ? <span className="muwi-toolbar__label">{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
