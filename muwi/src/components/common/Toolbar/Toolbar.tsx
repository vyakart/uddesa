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
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 40,
        padding: '0.25rem 0.5rem',
        borderRadius: 10,
        border: '1px solid #dddddd',
        backgroundColor: '#ffffff',
      }}
    >
      {items.map((item) => {
        if (isSeparator(item)) {
          return (
            <div
              key={item.id}
              role="separator"
              aria-orientation="vertical"
              style={{
                width: 1,
                height: 22,
                margin: '0 4px',
                backgroundColor: '#d5d5d5',
              }}
            />
          );
        }

        const isPressed = Boolean(item.toggle && item.isActive);
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 8,
              border: item.isActive ? '1px solid #4A90A4' : '1px solid #cfcfcf',
              minHeight: 30,
              padding: '0 10px',
              backgroundColor: item.isActive ? '#e7f4f8' : '#f8f8f8',
              color: '#202020',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
