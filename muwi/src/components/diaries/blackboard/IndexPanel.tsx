import { useBlackboardStore } from '@/stores/blackboardStore';
import type { IndexEntry } from '@/types';

interface IndexPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToElement?: (elementId: string, position: { x: number; y: number }) => void;
}

export function IndexPanel({
  isCollapsed,
  onToggleCollapse,
  onNavigateToElement,
}: IndexPanelProps) {
  const index = useBlackboardStore((state) => state.index);

  const handleItemClick = (entry: IndexEntry) => {
    onNavigateToElement?.(entry.elementId, entry.position);
  };

  const getIndentation = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return 0;
      case 2:
        return 16;
      case 3:
        return 32;
      default:
        return 0;
    }
  };

  const getFontSize = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return '14px';
      case 2:
        return '13px';
      case 3:
        return '12px';
      default:
        return '13px';
    }
  };

  const getFontWeight = (level: 1 | 2 | 3) => {
    return level === 1 ? 600 : 400;
  };

  if (isCollapsed) {
    return (
      <div className="muwi-blackboard-index is-collapsed">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="muwi-sidebar-button"
          title="Expand index"
        >
          ≡
        </button>
      </div>
    );
  }

  return (
    <section className="muwi-blackboard-index" aria-label="Blackboard index">
      <div className="muwi-blackboard-index__header">
        <p className="muwi-blackboard-index__label">INDEX</p>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="muwi-sidebar-button"
          title="Collapse index"
        >
          ←
        </button>
      </div>

      <div className="muwi-blackboard-index__body">
        {index.length === 0 ? (
          <p className="muwi-blackboard-index__empty">Add headings to build an index</p>
        ) : (
          <ul className="muwi-blackboard-index__list">
            {index.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(entry)}
                  className="muwi-blackboard-index__item"
                  data-level={entry.level}
                  style={{
                    paddingInlineStart: `${12 + getIndentation(entry.level)}px`,
                    fontSize: getFontSize(entry.level),
                    fontWeight: getFontWeight(entry.level),
                  }}
                  title={entry.title}
                >
                  {entry.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {index.length > 0 && (
        <div className="muwi-blackboard-index__footer">
          {index.length} heading{index.length !== 1 ? 's' : ''}
        </div>
      )}
    </section>
  );
}
