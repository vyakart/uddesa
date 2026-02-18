import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const MENU_DEFAULT_WIDTH = 220;
const MENU_MAX_HEIGHT = 280;
const SUBMENU_WIDTH = 220;
const ITEM_HEIGHT = 32;
const SEPARATOR_HEIGHT = 9;
const MENU_EDGE_PADDING = 8;

export interface ContextMenuActionItem {
  id: string;
  type?: 'item';
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
  destructive?: boolean;
  shortcut?: string;
  icon?: ReactNode;
}

export interface ContextMenuSeparatorItem {
  id: string;
  type: 'separator';
}

export type ContextMenuItem = ContextMenuActionItem | ContextMenuSeparatorItem;

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

function isSeparator(item: ContextMenuItem): item is ContextMenuSeparatorItem {
  return item.type === 'separator';
}

function isSelectableItem(item: ContextMenuItem): item is ContextMenuActionItem {
  return !isSeparator(item) && !item.disabled;
}

function hasSubmenu(item: ContextMenuItem): item is ContextMenuActionItem & { submenu: ContextMenuItem[] } {
  return !isSeparator(item) && Boolean(item.submenu?.length);
}

function measureMenuHeight(items: ContextMenuItem[]): number {
  const contentHeight = items.reduce(
    (height, item) => height + (isSeparator(item) ? SEPARATOR_HEIGHT : ITEM_HEIGHT),
    0
  );
  return Math.min(MENU_MAX_HEIGHT, contentHeight + 2 * 4);
}

function clampPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const maxX = Math.max(MENU_EDGE_PADDING, window.innerWidth - width - MENU_EDGE_PADDING);
  const maxY = Math.max(MENU_EDGE_PADDING, window.innerHeight - height - MENU_EDGE_PADDING);
  return {
    x: Math.min(Math.max(MENU_EDGE_PADDING, x), maxX),
    y: Math.min(Math.max(MENU_EDGE_PADDING, y), maxY),
  };
}

function firstSelectableIndex(items: ContextMenuItem[]): number {
  return items.findIndex((item) => isSelectableItem(item));
}

function getNextSelectableIndex(items: ContextMenuItem[], currentIndex: number, direction: 1 | -1): number {
  if (items.length === 0) {
    return -1;
  }

  let nextIndex = currentIndex;
  for (let i = 0; i < items.length; i += 1) {
    nextIndex = (nextIndex + direction + items.length) % items.length;
    if (isSelectableItem(items[nextIndex])) {
      return nextIndex;
    }
  }
  return currentIndex;
}

function getMenuOffsetTop(items: ContextMenuItem[], index: number): number {
  const offset = items.slice(0, index).reduce((height, item) => {
    return height + (isSeparator(item) ? SEPARATOR_HEIGHT : ITEM_HEIGHT);
  }, 0);

  return offset + 4;
}

export function ContextMenu({ isOpen, x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const [submenuActiveIndex, setSubmenuActiveIndex] = useState(-1);

  const measuredMenuHeight = useMemo(() => measureMenuHeight(items), [items]);
  const position = useMemo(
    () => clampPosition(x, y, MENU_DEFAULT_WIDTH, measuredMenuHeight),
    [measuredMenuHeight, x, y]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const firstIndex = firstSelectableIndex(items);
    setActiveIndex(firstIndex);
    setOpenSubmenuIndex(null);
    setSubmenuActiveIndex(-1);

    const focusTimer = window.requestAnimationFrame(() => {
      rootRef.current?.focus();
    });

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
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('mousedown', onMouseDown);

      const focusTarget = returnFocusRef.current;
      if (focusTarget && document.contains(focusTarget)) {
        focusTarget.focus();
      }
      returnFocusRef.current = null;
    };
  }, [isOpen, items, onClose]);

  if (!isOpen || items.length === 0) {
    return null;
  }

  const hasSubmenuOpen =
    openSubmenuIndex !== null && hasSubmenu(items[openSubmenuIndex]);
  const openSubmenuItems = hasSubmenuOpen ? items[openSubmenuIndex].submenu : [];

  const submenuTopRaw = hasSubmenuOpen
    ? position.y + getMenuOffsetTop(items, openSubmenuIndex)
    : position.y;
  const submenuHeight = measureMenuHeight(openSubmenuItems);
  const submenuTop = Math.min(
    submenuTopRaw,
    Math.max(MENU_EDGE_PADDING, window.innerHeight - submenuHeight - MENU_EDGE_PADDING)
  );
  const canOpenRight =
    position.x + MENU_DEFAULT_WIDTH + SUBMENU_WIDTH + MENU_EDGE_PADDING < window.innerWidth;
  const submenuLeft = canOpenRight
    ? position.x + MENU_DEFAULT_WIDTH - 2
    : Math.max(MENU_EDGE_PADDING, position.x - SUBMENU_WIDTH + 2);

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Context menu"
      tabIndex={0}
      className="muwi-context-menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          onClose();
          return;
        }

        if (hasSubmenuOpen) {
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSubmenuActiveIndex((index) =>
              getNextSelectableIndex(
                openSubmenuItems,
                index < 0 ? firstSelectableIndex(openSubmenuItems) : index,
                -1
              )
            );
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSubmenuActiveIndex((index) =>
              getNextSelectableIndex(
                openSubmenuItems,
                index < 0 ? firstSelectableIndex(openSubmenuItems) : index,
                1
              )
            );
            return;
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setOpenSubmenuIndex(null);
            setSubmenuActiveIndex(-1);
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const submenuItem = openSubmenuItems[submenuActiveIndex];
            if (submenuItem && isSelectableItem(submenuItem) && !hasSubmenu(submenuItem)) {
              submenuItem.onSelect?.();
              onClose();
            }
            return;
          }
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveIndex((index) =>
            getNextSelectableIndex(items, index < 0 ? firstSelectableIndex(items) : index, -1)
          );
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIndex((index) =>
            getNextSelectableIndex(items, index < 0 ? firstSelectableIndex(items) : index, 1)
          );
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const activeItem = items[activeIndex];
          if (activeItem && hasSubmenu(activeItem) && !activeItem.disabled) {
            setOpenSubmenuIndex(activeIndex);
            setSubmenuActiveIndex(firstSelectableIndex(activeItem.submenu));
          }
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const activeItem = items[activeIndex];
          if (!activeItem || !isSelectableItem(activeItem)) {
            return;
          }
          if (hasSubmenu(activeItem)) {
            setOpenSubmenuIndex(activeIndex);
            setSubmenuActiveIndex(firstSelectableIndex(activeItem.submenu));
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
      }}
    >
      {items.map((item, index) => {
        if (isSeparator(item)) {
          return <div key={item.id} role="separator" className="muwi-context-menu__separator" />;
        }

        const isActive = index === activeIndex;
        const itemHasSubmenu = hasSubmenu(item);

        return (
          <button
            key={item.id}
            role="menuitem"
            aria-haspopup={itemHasSubmenu || undefined}
            aria-expanded={itemHasSubmenu ? openSubmenuIndex === index : undefined}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            onMouseEnter={() => {
              if (item.disabled) {
                setOpenSubmenuIndex(null);
                setSubmenuActiveIndex(-1);
                return;
              }
              setActiveIndex(index);
              if (itemHasSubmenu) {
                setOpenSubmenuIndex(index);
                setSubmenuActiveIndex(firstSelectableIndex(item.submenu ?? []));
              } else {
                setOpenSubmenuIndex(null);
                setSubmenuActiveIndex(-1);
              }
            }}
            onClick={() => {
              if (item.disabled) {
                return;
              }
              if (itemHasSubmenu) {
                setOpenSubmenuIndex(index);
                setSubmenuActiveIndex(firstSelectableIndex(item.submenu ?? []));
                return;
              }
              item.onSelect?.();
              onClose();
            }}
            className="muwi-context-menu__item"
            data-active={isActive ? 'true' : 'false'}
            data-destructive={item.destructive ? 'true' : 'false'}
          >
            <span className="muwi-context-menu__item-main">
              {item.icon ? <span className="muwi-context-menu__icon" aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
            </span>
            <span className="muwi-context-menu__item-meta">
              {item.shortcut ? <span className="muwi-context-menu__shortcut">{item.shortcut}</span> : null}
              {itemHasSubmenu ? <span aria-hidden="true">▶</span> : null}
            </span>
          </button>
        );
      })}

      {hasSubmenuOpen ? (
        <div
          role="menu"
          aria-label="Submenu"
          className="muwi-context-menu muwi-context-menu--submenu"
          style={{
            position: 'fixed',
            top: submenuTop,
            left: submenuLeft,
            zIndex: 1101,
          }}
        >
          {openSubmenuItems.map((submenuItem, index) => (
            isSeparator(submenuItem) ? (
              <div key={submenuItem.id} role="separator" className="muwi-context-menu__separator" />
            ) : (
              <button
                key={submenuItem.id}
                role="menuitem"
                aria-disabled={submenuItem.disabled || undefined}
                disabled={submenuItem.disabled}
                onMouseEnter={() => {
                  if (submenuItem.disabled) {
                    return;
                  }
                  setSubmenuActiveIndex(index);
                }}
                onClick={() => {
                  if (submenuItem.disabled || hasSubmenu(submenuItem)) {
                    return;
                  }
                  submenuItem.onSelect?.();
                  onClose();
                }}
                className="muwi-context-menu__item"
                data-active={index === submenuActiveIndex ? 'true' : 'false'}
                data-destructive={submenuItem.destructive ? 'true' : 'false'}
              >
                <span className="muwi-context-menu__item-main">
                  {submenuItem.icon ? (
                    <span className="muwi-context-menu__icon" aria-hidden="true">
                      {submenuItem.icon}
                    </span>
                  ) : null}
                  <span>{submenuItem.label}</span>
                </span>
                <span className="muwi-context-menu__item-meta">
                  {submenuItem.shortcut ? (
                    <span className="muwi-context-menu__shortcut">{submenuItem.shortcut}</span>
                  ) : null}
                </span>
              </button>
            )
          ))}
        </div>
      ) : null}
    </div>
  );
}
