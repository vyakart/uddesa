import { useEffect } from 'react';
import { useAppStore, selectCurrentView, selectActiveDiary } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGlobalShortcuts } from '@/hooks';
import { Shelf } from '@/components/shelf';
import { DiaryLayout } from '@/components/common';
import { PersonalDiary } from '@/components/diaries/PersonalDiary';
import { Blackboard } from '@/components/diaries/blackboard';
import { Scratchpad } from '@/components/diaries/scratchpad';


function DraftsPlaceholder() {
  return (
    <DiaryLayout diaryType="drafts">
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Drafts - Coming soon</p>
      </div>
    </DiaryLayout>
  );
}

function LongDraftsPlaceholder() {
  return (
    <DiaryLayout diaryType="long-drafts">
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Long Drafts - Coming soon</p>
      </div>
    </DiaryLayout>
  );
}

function AcademicPlaceholder() {
  return (
    <DiaryLayout diaryType="academic">
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Academic Papers - Coming soon</p>
      </div>
    </DiaryLayout>
  );
}

function App() {
  const currentView = useAppStore(selectCurrentView);
  const activeDiary = useAppStore(selectActiveDiary);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Load settings on mount
  useEffect(() => {
    if (!isSettingsLoaded) {
      loadSettings();
    }
  }, [isSettingsLoaded, loadSettings]);

  // Show loading state while settings load
  if (!isSettingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'shelf' || !activeDiary) {
    return <Shelf />;
  }

  // Render the appropriate diary component
  switch (activeDiary) {
    case 'scratchpad':
      return <Scratchpad />;
    case 'blackboard':
      return <Blackboard />;
    case 'personal-diary':
      return <PersonalDiary />;
    case 'drafts':
      return <DraftsPlaceholder />;
    case 'long-drafts':
      return <LongDraftsPlaceholder />;
    case 'academic':
      return <AcademicPlaceholder />;
    default:
      return <Shelf />;
  }
}

export default App;
