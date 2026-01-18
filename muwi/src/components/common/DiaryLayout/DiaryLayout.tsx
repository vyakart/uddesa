import type { ReactNode } from 'react';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { DIARY_INFO } from '@/components/shelf/DiaryCard';

interface DiaryLayoutProps {
  children: ReactNode;
  diaryType: DiaryType;
  showToolbar?: boolean;
  toolbar?: ReactNode;
}

export function DiaryLayout({ children, diaryType, showToolbar = true, toolbar }: DiaryLayoutProps) {
  const closeDiary = useAppStore((state) => state.closeDiary);
  const info = DIARY_INFO[diaryType];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Back Button */}
        <button
          onClick={closeDiary}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back to shelf"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Shelf
          </span>
        </button>

        {/* Title */}
        <h1
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <span role="img" aria-hidden="true">
            {info.icon}
          </span>
          {info.name}
        </h1>

        {/* Toolbar placeholder */}
        <div className="min-w-[80px]">{showToolbar && toolbar}</div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
