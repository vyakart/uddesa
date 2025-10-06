export interface OutlineBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OutlineItem {
  id: string;
  label: string;
  level: 1 | 2 | 3;
  detail?: string;
  bounds?: OutlineBounds | null;
}

interface OutlinePanelProps {
  items: OutlineItem[];
  activeId: string | null;
  onSelect?: (item: OutlineItem) => void;
}

export function OutlinePanel({ items, activeId, onSelect }: OutlinePanelProps) {
  const hasItems = items.length > 0;

  return (
    <section className="outline-panel" aria-label="Outline">
      <header className="outline-panel__header">
        <span className="outline-panel__title">Outline</span>
        <span className="outline-panel__count" aria-hidden={!hasItems}>
          {hasItems ? items.length : '0'}
        </span>
      </header>
      {hasItems ? (
        <ul className="outline-panel__list">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li
                key={item.id}
                className={[
                  'outline-panel__item',
                  `outline-panel__item--level${item.level}`,
                  isActive ? 'outline-panel__item--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="outline-panel__button"
                  onClick={() => {
                    onSelect?.(item);
                  }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="outline-panel__label">{item.label}</span>
                  {item.detail ? <span className="outline-panel__detail">{item.detail}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="outline-panel__empty">Add text layers on the board to build an outline.</p>
      )}
    </section>
  );
}
