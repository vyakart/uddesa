import type { ReactNode } from 'react';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { DIARY_INFO } from '@/components/shelf/DiaryCard';
import { NavigationHeader } from '@/components/common/NavigationHeader';

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
      <NavigationHeader
        title={info.name}
        icon={info.icon}
        onBack={closeDiary}
        rightContent={showToolbar ? toolbar : null}
      />

      {/* Content */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</main>
    </div>
  );
}
