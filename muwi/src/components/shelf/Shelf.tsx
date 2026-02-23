import { useMemo, useRef, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Settings } from 'lucide-react';
import { db } from '@/db/database';
import { DiaryCard } from './DiaryCard';
import { useAppStore, type DiaryType } from '@/stores/appStore';
import { useSettingsStore, selectShelfLayout } from '@/stores/settingsStore';
import { usePrefersReducedMotion } from '@/hooks';
import { Button } from '@/components/common/Button';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import { Modal } from '@/components/common/Modal';
import { SettingsPanel } from './SettingsPanel';

const DIARY_ORDER: DiaryType[] = [
  'scratchpad',
  'blackboard',
  'personal-diary',
  'drafts',
  'long-drafts',
  'academic',
];

const DIARY_UNITS: Record<DiaryType, string> = {
  scratchpad: 'page',
  blackboard: 'canvas',
  'personal-diary': 'entry',
  drafts: 'draft',
  'long-drafts': 'document',
  academic: 'paper',
};

const EMPTY_METADATA = 'No entries yet';

type DiaryMetadata = Record<DiaryType, { count: number; lastModified: Date | null; text: string }>;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function latestByModifiedAt<T extends { modifiedAt?: Date | string }>(records: T[]): Date | null {
  let latest: Date | null = null;

  for (const record of records) {
    const candidate = toDate(record.modifiedAt);
    if (!candidate) {
      continue;
    }

    if (!latest || candidate.getTime() > latest.getTime()) {
      latest = candidate;
    }
  }

  return latest;
}

function formatMetadata(type: DiaryType, count: number, lastModified: Date | null): string {
  if (count === 0) {
    return EMPTY_METADATA;
  }

  const unit = DIARY_UNITS[type];
  const unitLabel = count === 1 ? unit : `${unit}s`;

  if (!lastModified) {
    return `${count} ${unitLabel}`;
  }

  return `${count} ${unitLabel} · ${formatDistanceToNow(lastModified, { addSuffix: true })}`;
}

function createEmptyMetadata(): DiaryMetadata {
  return {
    scratchpad: { count: 0, lastModified: null, text: EMPTY_METADATA },
    blackboard: { count: 0, lastModified: null, text: EMPTY_METADATA },
    'personal-diary': { count: 0, lastModified: null, text: EMPTY_METADATA },
    drafts: { count: 0, lastModified: null, text: EMPTY_METADATA },
    'long-drafts': { count: 0, lastModified: null, text: EMPTY_METADATA },
    academic: { count: 0, lastModified: null, text: EMPTY_METADATA },
  };
}

export function Shelf() {
  const openDiary = useAppStore((state) => state.openDiary);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const lastOpenedDiary = useAppStore((state) => state.lastOpenedDiary);

  const shelfLayout = useSettingsStore(selectShelfLayout);
  const updateShelfLayout = useSettingsStore((state) => state.updateShelfLayout);

  const [metadata, setMetadata] = useState<DiaryMetadata>(() => createEmptyMetadata());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDiary, setTransitionDiary] = useState<DiaryType | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    diaryType: DiaryType;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadMetadata = async () => {
      const [scratchpadPages, blackboardCanvases, diaryEntries, drafts, longDrafts, academicPapers] =
        await Promise.all([
          db.scratchpadPages.toArray(),
          db.blackboardCanvases.toArray(),
          db.diaryEntries.toArray(),
          db.drafts.toArray(),
          db.longDrafts.toArray(),
          db.academicPapers.toArray(),
        ]);

      if (isCancelled) {
        return;
      }

      const scratchpadLastModified = latestByModifiedAt(scratchpadPages);
      const blackboardLastModified = latestByModifiedAt(blackboardCanvases);
      const personalDiaryLastModified = latestByModifiedAt(diaryEntries);
      const draftsLastModified = latestByModifiedAt(drafts);
      const longDraftsLastModified = latestByModifiedAt(longDrafts);
      const academicLastModified = latestByModifiedAt(academicPapers);

      const next: DiaryMetadata = {
        scratchpad: {
          count: scratchpadPages.length,
          lastModified: scratchpadLastModified,
          text: formatMetadata('scratchpad', scratchpadPages.length, scratchpadLastModified),
        },
        blackboard: {
          count: blackboardCanvases.length,
          lastModified: blackboardLastModified,
          text: formatMetadata('blackboard', blackboardCanvases.length, blackboardLastModified),
        },
        'personal-diary': {
          count: diaryEntries.length,
          lastModified: personalDiaryLastModified,
          text: formatMetadata('personal-diary', diaryEntries.length, personalDiaryLastModified),
        },
        drafts: {
          count: drafts.length,
          lastModified: draftsLastModified,
          text: formatMetadata('drafts', drafts.length, draftsLastModified),
        },
        'long-drafts': {
          count: longDrafts.length,
          lastModified: longDraftsLastModified,
          text: formatMetadata('long-drafts', longDrafts.length, longDraftsLastModified),
        },
        academic: {
          count: academicPapers.length,
          lastModified: academicLastModified,
          text: formatMetadata('academic', academicPapers.length, academicLastModified),
        },
      };

      setMetadata(next);
    };

    void loadMetadata();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const handleDiaryClick = (type: DiaryType) => {
    if (isTransitioning) {
      return;
    }

    if (prefersReducedMotion) {
      openDiary(type);
      return;
    }

    setTransitionDiary(type);
    setIsTransitioning(true);

    transitionTimerRef.current = window.setTimeout(() => {
      openDiary(type);
    }, 220);
  };

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
          { id: 'layout-grid', label: 'Grid View', onSelect: () => void updateShelfLayout('grid') },
          { id: 'layout-list', label: 'List View', onSelect: () => void updateShelfLayout('list') },
          { id: 'layout-shelf', label: 'Shelf View', onSelect: () => void updateShelfLayout('shelf') },
        ],
      },
    ];
  }, [contextMenuState, openDiary, updateShelfLayout]);

  const mainClassName = ['muwi-shelf__grid', `is-${shelfLayout}`].join(' ');

  return (
    <div className="muwi-shelf" data-transitioning={isTransitioning ? 'true' : 'false'}>
      <header className="muwi-shelf__header">
        <h1 className="muwi-shelf__title">MUWI</h1>
        <Button
          type="button"
          onClick={openSettings}
          variant="ghost"
          size="md"
          iconOnly
          aria-label="Settings"
        >
          <Settings size={20} aria-hidden="true" />
        </Button>
      </header>

      <main className={mainClassName} data-layout={shelfLayout} data-testid="shelf-layout">
        {DIARY_ORDER.map((type) => (
          <DiaryCard
            key={type}
            type={type}
            layout={shelfLayout}
            metadata={metadata[type].text}
            isSelected={transitionDiary === type || lastOpenedDiary === type}
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

      <p className="muwi-shelf__hint">⌘K to open command palette</p>

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
