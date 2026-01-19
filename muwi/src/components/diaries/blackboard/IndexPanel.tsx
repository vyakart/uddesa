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

  // Get indentation based on heading level
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

  // Get font size based on heading level
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

  // Get font weight based on heading level
  const getFontWeight = (level: 1 | 2 | 3) => {
    return level === 1 ? 600 : 400;
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          width: '40px',
          height: '100%',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '16px',
          }}
          title="Expand index"
        >
          ≡
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '220px',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#333',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Index
        </span>
        <button
          onClick={onToggleCollapse}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
          }}
          title="Collapse index"
        >
          ←
        </button>
      </div>

      {/* Index items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {index.length === 0 ? (
          <div
            style={{
              padding: '16px',
              color: '#888',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ marginBottom: '8px' }}>No headings found</p>
            <p style={{ fontSize: '11px', color: '#aaa' }}>
              Add text starting with #, ##, or ### to create headings
            </p>
          </div>
        ) : (
          index.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleItemClick(entry)}
              style={{
                width: '100%',
                padding: '8px 16px',
                paddingLeft: `${16 + getIndentation(entry.level)}px`,
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: getFontSize(entry.level),
                fontWeight: getFontWeight(entry.level),
                color: '#333',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8e8e8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={entry.title}
            >
              {entry.title}
            </button>
          ))
        )}
      </div>

      {/* Footer with count */}
      {index.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #e0e0e0',
            fontSize: '11px',
            color: '#888',
          }}
        >
          {index.length} heading{index.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
