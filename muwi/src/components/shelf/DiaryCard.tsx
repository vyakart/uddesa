import { type DiaryType } from '@/stores/appStore';
import type { MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  NotebookPen,
  Presentation,
  BookOpen,
  FileText,
  BookCopy,
  GraduationCap,
} from 'lucide-react';

interface DiaryInfo {
  type: DiaryType;
  name: string;
  description: string;
  icon: LucideIcon;
}

const DIARY_INFO: Record<DiaryType, DiaryInfo> = {
  scratchpad: {
    type: 'scratchpad',
    name: 'Scratchpad',
    description: 'Quick capture of fleeting ideas',
    icon: NotebookPen,
  },
  blackboard: {
    type: 'blackboard',
    name: 'Blackboard',
    description: 'Visual thinking and idea mapping',
    icon: Presentation,
  },
  'personal-diary': {
    type: 'personal-diary',
    name: 'Personal Diary',
    description: 'Daily journaling with dated entries',
    icon: BookOpen,
  },
  drafts: {
    type: 'drafts',
    name: 'Drafts',
    description: 'Essays, posts, and shorter pieces',
    icon: FileText,
  },
  'long-drafts': {
    type: 'long-drafts',
    name: 'Long Drafts',
    description: 'Books, theses, and long-form work',
    icon: BookCopy,
  },
  academic: {
    type: 'academic',
    name: 'Academic Papers',
    description: 'Research writing with citations',
    icon: GraduationCap,
  },
};

interface DiaryCardProps {
  type: DiaryType;
  onClick: (type: DiaryType) => void;
  onContextMenu?: (event: MouseEvent, type: DiaryType) => void;
  layout?: 'grid' | 'list' | 'shelf';
  metadata: string;
  isSelected?: boolean;
}

export function DiaryCard({
  type,
  onClick,
  onContextMenu,
  layout = 'grid',
  metadata,
  isSelected = false,
}: DiaryCardProps) {
  const info = DIARY_INFO[type];
  const Icon = info.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      onContextMenu={(event) => {
        if (!onContextMenu) {
          return;
        }
        event.preventDefault();
        onContextMenu(event, type);
      }}
      data-layout={layout}
      data-selected={isSelected ? 'true' : 'false'}
      className="muwi-diary-card"
      aria-label={`Open ${info.name}`}
    >
      <span className="muwi-diary-card__icon" aria-hidden="true">
        <Icon size={24} strokeWidth={1.8} />
      </span>

      <div className="muwi-diary-card__body">
        <h3 className="muwi-diary-card__title">{info.name}</h3>
        <p className="muwi-diary-card__description">{info.description}</p>
      </div>

      <p className="muwi-diary-card__meta">{metadata}</p>
    </button>
  );
}

export { DIARY_INFO };
