import type React from 'react';
import { DiaryCard } from './DiaryCard';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { useSettingsStore, selectShelfLayout } from '@/stores/settingsStore';
import { ContextMenu, Modal, type ContextMenuItem } from '@/components/common';
import { useMemo, useState } from 'react';
import { SettingsPanel } from './SettingsPanel';

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
  const closeSettings = useAppStore((state) => state.closeSettings);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const shelfLayout = useSettingsStore(selectShelfLayout);
  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    diaryType: DiaryType;
  } | null>(null);

  const handleDiaryClick = (type: DiaryType) => {
    openDiary(type);
  };

  const gridStyles: React.CSSProperties = useMemo(() => {
    if (shelfLayout === 'list') {
      return {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        maxWidth: '760px',
        margin: '0 auto',
      };
    }

    if (shelfLayout === 'shelf') {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.9rem',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        borderRadius: 14,
        border: '1px solid #d7d2c3',
        background:
          'linear-gradient(180deg, rgba(169, 137, 92, 0.18) 0%, rgba(143, 111, 68, 0.28) 100%)',
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
    };
  }, [shelfLayout]);

  const contextItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenuState) {
      return [];
    }

    return [
      {
        id: 'open',
        label: 'Open Diary',
        onSelect: () => openDiary(contextMenuState.diaryType),
      },
      {
        id: 'layout',
        label: 'Layout',
        submenu: [
          { id: 'layout-grid', label: 'Grid View' },
          { id: 'layout-list', label: 'List View' },
          { id: 'layout-shelf', label: 'Shelf View' },
        ],
      },
    ];
  }, [contextMenuState, openDiary]);

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
      <main style={gridStyles} data-layout={shelfLayout} data-testid="shelf-layout">
        {DIARY_ORDER.map((type) => (
          <DiaryCard
            key={type}
            type={type}
            layout={shelfLayout}
            onClick={handleDiaryClick}
            onContextMenu={(event, diaryType) => {
              setContextMenuState({
                x: event.clientX,
                y: event.clientY,
                diaryType,
              });
            }}
          />
        ))}
      </main>

      <ContextMenu
        isOpen={Boolean(contextMenuState)}
        x={contextMenuState?.x ?? 0}
        y={contextMenuState?.y ?? 0}
        items={contextItems}
        onClose={() => setContextMenuState(null)}
      />

      <Modal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        title="Settings"
        maxWidth={640}
        className="muwi-settings-modal"
      >
        <SettingsPanel />
      </Modal>
    </div>
  );
}
