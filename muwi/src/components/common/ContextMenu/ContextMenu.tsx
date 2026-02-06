import { useEffect, useMemo, useRef, useState } from 'react';

const MENU_WIDTH = 240;
const MENU_HEIGHT = 280;
const SUBMENU_WIDTH = 220;
const ITEM_HEIGHT = 34;

export interface ContextMenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  const maxX = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - MENU_HEIGHT - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
}

export function ContextMenu({ isOpen, x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const [submenuActiveIndex, setSubmenuActiveIndex] = useState(0);

  const position = useMemo(() => clampPosition(x, y), [x, y]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) {
    return null;
  }

  const hasSubmenuOpen =
    openSubmenuIndex !== null && items[openSubmenuIndex] && items[openSubmenuIndex].submenu;
  const openSubmenuItems = hasSubmenuOpen ? items[openSubmenuIndex].submenu ?? [] : [];

  const submenuTop = hasSubmenuOpen ? position.y + openSubmenuIndex * ITEM_HEIGHT : position.y;
  const canOpenRight = position.x + MENU_WIDTH + SUBMENU_WIDTH + 8 < window.innerWidth;
  const submenuLeft = canOpenRight ? position.x + MENU_WIDTH - 4 : position.x - SUBMENU_WIDTH + 4;

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Context menu"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }

        if (hasSubmenuOpen) {
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSubmenuActiveIndex((index) => (index - 1 + openSubmenuItems.length) % openSubmenuItems.length);
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSubmenuActiveIndex((index) => (index + 1) % openSubmenuItems.length);
            return;
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setOpenSubmenuIndex(null);
            setSubmenuActiveIndex(0);
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const submenuItem = openSubmenuItems[submenuActiveIndex];
            if (submenuItem && !submenuItem.disabled) {
              submenuItem.onSelect?.();
              onClose();
            }
            return;
          }
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveIndex((index) => (index - 1 + items.length) % items.length);
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIndex((index) => (index + 1) % items.length);
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const activeItem = items[activeIndex];
          if (activeItem?.submenu?.length) {
            setOpenSubmenuIndex(activeIndex);
            setSubmenuActiveIndex(0);
          }
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          const activeItem = items[activeIndex];
          if (!activeItem || activeItem.disabled) {
            return;
          }
          if (activeItem.submenu?.length) {
            setOpenSubmenuIndex(activeIndex);
            setSubmenuActiveIndex(0);
            return;
          }
          activeItem.onSelect?.();
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1100,
        minWidth: MENU_WIDTH,
        padding: 6,
        borderRadius: 10,
        border: '1px solid #d9d9d9',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
      }}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const hasSubmenu = Boolean(item.submenu?.length);

        return (
          <button
            key={item.id}
            role="menuitem"
            aria-haspopup={hasSubmenu || undefined}
            aria-expanded={hasSubmenu ? openSubmenuIndex === index : undefined}
            disabled={item.disabled}
            onMouseEnter={() => {
              setActiveIndex(index);
              if (hasSubmenu) {
                setOpenSubmenuIndex(index);
                setSubmenuActiveIndex(0);
              } else {
                setOpenSubmenuIndex(null);
              }
            }}
            onClick={() => {
              if (item.disabled) {
                return;
              }
              if (hasSubmenu) {
                setOpenSubmenuIndex(index);
                setSubmenuActiveIndex(0);
                return;
              }
              item.onSelect?.();
              onClose();
            }}
            style={{
              width: '100%',
              height: ITEM_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 'none',
              borderRadius: 8,
              padding: '0 10px',
              backgroundColor: isActive ? '#eef4f6' : 'transparent',
              color: item.disabled ? '#a3a3a3' : '#202020',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{item.label}</span>
            {hasSubmenu ? <span aria-hidden="true">▶</span> : null}
          </button>
        );
      })}

      {hasSubmenuOpen ? (
        <div
          role="menu"
          aria-label="Submenu"
          style={{
            position: 'fixed',
            top: Math.min(submenuTop, window.innerHeight - Math.min(MENU_HEIGHT, openSubmenuItems.length * ITEM_HEIGHT + 12)),
            left: submenuLeft,
            zIndex: 1101,
            minWidth: SUBMENU_WIDTH,
            padding: 6,
            borderRadius: 10,
            border: '1px solid #d9d9d9',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
          }}
        >
          {openSubmenuItems.map((submenuItem, index) => (
            <button
              key={submenuItem.id}
              role="menuitem"
              disabled={submenuItem.disabled}
              onMouseEnter={() => setSubmenuActiveIndex(index)}
              onClick={() => {
                if (submenuItem.disabled) {
                  return;
                }
                submenuItem.onSelect?.();
                onClose();
              }}
              style={{
                width: '100%',
                height: ITEM_HEIGHT,
                border: 'none',
                borderRadius: 8,
                padding: '0 10px',
                backgroundColor: index === submenuActiveIndex ? '#eef4f6' : 'transparent',
                color: submenuItem.disabled ? '#a3a3a3' : '#202020',
                textAlign: 'left',
                cursor: submenuItem.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {submenuItem.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
