import type React from 'react';
import { DiaryCard } from './DiaryCard';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { useSettingsStore, selectShelfLayout } from '@/stores/settingsStore';

const DIARY_ORDER: DiaryType[] = [
  'scratchpad',
  'blackboard',
  'personal-diary',
  'drafts',
  'long-drafts',
  'academic',
];

export function Shelf() {
  const openDiary = useAppStore((state) => state.openDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const shelfLayout = useSettingsStore(selectShelfLayout);

  const handleDiaryClick = (type: DiaryType) => {
    openDiary(type);
  };

  const gridStyles: React.CSSProperties =
    shelfLayout === 'list'
      ? {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '672px',
          margin: '0 auto',
        }
      : {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
        };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#FAFAFA',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          maxWidth: '1200px',
          margin: '0 auto 2rem auto',
        }}
      >
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 600,
            color: '#1A1A1A',
          }}
        >
          MUWI
        </h1>
        <button
          onClick={openSettings}
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#666666' }}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '1.125rem',
          marginBottom: '2rem',
          opacity: 0.75,
          color: '#666666',
          maxWidth: '1200px',
          margin: '0 auto 2rem auto',
        }}
      >
        Multi-Utility Writing Interface
      </p>

      {/* Diary Grid */}
      <main style={gridStyles}>
        {DIARY_ORDER.map((type) => (
          <DiaryCard key={type} type={type} onClick={handleDiaryClick} />
        ))}
      </main>
    </div>
  );
}
