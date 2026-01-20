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
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        {/* Back Button */}
        <button
          onClick={closeDiary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
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
            style={{ color: '#666666' }}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666666',
            }}
          >
            Shelf
          </span>
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1A1A1A',
          }}
        >
          <span role="img" aria-hidden="true">
            {info.icon}
          </span>
          {info.name}
        </h1>

        {/* Toolbar placeholder */}
        <div style={{ minWidth: '80px' }}>{showToolbar && toolbar}</div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</main>
    </div>
  );
}
