import { type DiaryType } from '@/stores/appStore';
import { useState, type MouseEvent } from 'react';

interface DiaryInfo {
  type: DiaryType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const DIARY_INFO: Record<DiaryType, DiaryInfo> = {
  scratchpad: {
    type: 'scratchpad',
    name: 'Scratchpad',
    description: 'Quick capture of fleeting ideas',
    icon: '📝',
    color: '#BBDEFB',
  },
  blackboard: {
    type: 'blackboard',
    name: 'Blackboard',
    description: 'Visual thinking & idea mapping',
    icon: '🖤',
    color: '#2D3436',
  },
  'personal-diary': {
    type: 'personal-diary',
    name: 'Personal Diary',
    description: 'Daily journaling with dates',
    icon: '📔',
    color: '#FFFEF9',
  },
  drafts: {
    type: 'drafts',
    name: 'Drafts',
    description: 'Essays, posts, and letters',
    icon: '✏️',
    color: '#F5F5F5',
  },
  'long-drafts': {
    type: 'long-drafts',
    name: 'Long Drafts',
    description: 'Books, theses, and reports',
    icon: '📚',
    color: '#FFFFFF',
  },
  academic: {
    type: 'academic',
    name: 'Academic Papers',
    description: 'Citations and formal structure',
    icon: '🎓',
    color: '#FFFFFF',
  },
};

interface DiaryCardProps {
  type: DiaryType;
  onClick: (type: DiaryType) => void;
  onContextMenu?: (event: MouseEvent, type: DiaryType) => void;
  layout?: 'grid' | 'list' | 'shelf';
  lastModified?: Date;
  itemCount?: number;
}

function formatLastModified(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DiaryCard({
  type,
  onClick,
  onContextMenu,
  layout = 'grid',
  lastModified,
  itemCount = 0,
}: DiaryCardProps) {
  const info = DIARY_INFO[type];
  const isBlackboard = type === 'blackboard';
  const [isHovered, setIsHovered] = useState(false);

  const isList = layout === 'list';
  const isShelf = layout === 'shelf';

  const containerStyles: React.CSSProperties = isList
    ? {
        display: 'grid',
        gridTemplateColumns: '56px 1fr auto',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '1rem 1.1rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isShelf ? '1.25rem 1rem 1.5rem' : '2rem',
        minHeight: isShelf ? '200px' : '180px',
      };

  return (
    <button
      onClick={() => onClick(type)}
      onContextMenu={(event) => {
        if (!onContextMenu) {
          return;
        }
        event.preventDefault();
        onContextMenu(event, type);
      }}
      data-layout={layout}
      style={{
        ...containerStyles,
        borderRadius: '12px',
        border: `2px solid ${isBlackboard ? '#636e72' : '#E0E0E0'}`,
        backgroundColor: info.color,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
        textAlign: isList ? 'left' : 'center',
        boxShadow: isShelf ? 'inset 0 -8px 20px rgba(0, 0, 0, 0.08)' : undefined,
        transformOrigin: isShelf ? 'bottom center' : 'center',
      }}
      onMouseMove={(e) => {
        if (!isShelf) {
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
        e.currentTarget.style.transform = `translateY(-2px) rotate(${relativeX * 2.5}deg)`;
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = isShelf
          ? 'inset 0 -10px 24px rgba(0, 0, 0, 0.12), 0 10px 24px rgba(0,0,0,0.12)'
          : '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isShelf ? 'inset 0 -8px 20px rgba(0, 0, 0, 0.08)' : 'none';
      }}
      aria-label={`Open ${info.name}`}
    >
      <span
        style={{
          fontSize: isList ? '2rem' : '2.5rem',
          marginBottom: isList ? 0 : '0.75rem',
          justifySelf: 'center',
        }}
        role="img"
        aria-hidden="true"
      >
        {info.icon}
      </span>

      <div style={{ width: '100%' }}>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
            marginTop: 0,
            color: isBlackboard ? '#F5F5F5' : '#1A1A1A',
          }}
        >
          {info.name}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            textAlign: isList ? 'left' : 'center',
            color: isBlackboard ? '#b2bec3' : '#666666',
            margin: 0,
            opacity: isHovered ? 1 : 0.85,
          }}
        >
          {info.description}
        </p>
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: isBlackboard ? '#cfd8dc' : '#7a7a7a',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
          marginTop: isList ? 0 : '0.65rem',
          justifySelf: 'end',
        }}
      >
        {itemCount} item{itemCount === 1 ? '' : 's'}
        {lastModified ? ` • Updated ${formatLastModified(lastModified)}` : ''}
      </div>
    </button>
  );
}

export { DIARY_INFO };
