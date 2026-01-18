import { type DiaryType } from '@/stores/appStore';

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
  lastModified?: Date;
  itemCount?: number;
}

export function DiaryCard({ type, onClick, lastModified, itemCount }: DiaryCardProps) {
  const info = DIARY_INFO[type];
  const isBlackboard = type === 'blackboard';

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <button
      onClick={() => onClick(type)}
      className="group relative flex flex-col items-center justify-center rounded-lg p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        backgroundColor: info.color,
        borderColor: isBlackboard ? '#636e72' : 'var(--color-border)',
      }}
      aria-label={`Open ${info.name}`}
    >
      {/* Icon */}
      <span className="text-4xl mb-3" role="img" aria-hidden="true">
        {info.icon}
      </span>

      {/* Name */}
      <h3
        className="text-lg font-medium mb-1"
        style={{ color: isBlackboard ? '#F5F5F5' : 'var(--color-text-primary)' }}
      >
        {info.name}
      </h3>

      {/* Description */}
      <p
        className="text-sm text-center opacity-75"
        style={{ color: isBlackboard ? '#dfe6e9' : 'var(--color-text-secondary)' }}
      >
        {info.description}
      </p>

      {/* Stats (shown on hover) */}
      <div
        className="absolute bottom-2 left-2 right-2 flex justify-between text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: isBlackboard ? '#b2bec3' : 'var(--color-text-secondary)' }}
      >
        {lastModified && <span>Last: {formatDate(lastModified)}</span>}
        {itemCount !== undefined && (
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Subtle border */}
      <div
        className="absolute inset-0 rounded-lg border-2 opacity-10"
        style={{ borderColor: isBlackboard ? '#F5F5F5' : '#000000' }}
      />
    </button>
  );
}

export { DIARY_INFO };
