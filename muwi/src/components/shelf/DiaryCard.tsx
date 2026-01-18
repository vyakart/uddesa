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

export function DiaryCard({ type, onClick }: DiaryCardProps) {
  const info = DIARY_INFO[type];
  const isBlackboard = type === 'blackboard';

  return (
    <button
      onClick={() => onClick(type)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        borderRadius: '12px',
        border: `2px solid ${isBlackboard ? '#636e72' : '#E0E0E0'}`,
        backgroundColor: info.color,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        minHeight: '180px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      aria-label={`Open ${info.name}`}
    >
      <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} role="img" aria-hidden="true">
        {info.icon}
      </span>

      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '0.25rem',
          color: isBlackboard ? '#F5F5F5' : '#1A1A1A',
        }}
      >
        {info.name}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          textAlign: 'center',
          color: isBlackboard ? '#b2bec3' : '#666666',
          margin: 0,
        }}
      >
        {info.description}
      </p>
    </button>
  );
}

export { DIARY_INFO };
