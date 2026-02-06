import type { AppState, DiaryType, View } from '@/stores/appStore';

export type AppRoute =
  | {
      view: 'shelf';
    }
  | {
      view: 'diary';
      diaryType: DiaryType;
      itemId?: string;
    };

const validDiaryTypes = new Set<DiaryType>([
  'scratchpad',
  'blackboard',
  'personal-diary',
  'drafts',
  'long-drafts',
  'academic',
]);

function normalizePath(pathname: string): string[] {
  return pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function parseAppRoute(pathname: string): AppRoute {
  const segments = normalizePath(pathname);

  if (segments.length === 0) {
    return { view: 'shelf' };
  }

  const [diarySegment, itemSegment] = segments;
  if (!validDiaryTypes.has(diarySegment as DiaryType)) {
    return { view: 'shelf' };
  }

  const diaryType = diarySegment as DiaryType;
  if (!itemSegment) {
    return { view: 'diary', diaryType };
  }

  return {
    view: 'diary',
    diaryType,
    itemId: decodeURIComponent(itemSegment),
  };
}

export function buildDiaryPath(diaryType: DiaryType, itemId?: string): string {
  if (!itemId) {
    return `/${diaryType}`;
  }
  return `/${diaryType}/${encodeURIComponent(itemId)}`;
}

export function buildPathFromState(
  view: View,
  diaryType: DiaryType | null,
  itemId: string | null
): string {
  if (view === 'diary' && diaryType) {
    return buildDiaryPath(diaryType, itemId ?? undefined);
  }
  return '/';
}

export function routeMatchesState(route: AppRoute, state: AppState): boolean {
  if (route.view === 'shelf') {
    return state.currentView === 'shelf' && state.activeDiary === null;
  }

  return (
    state.currentView === 'diary' &&
    state.activeDiary === route.diaryType &&
    state.activeItemId === (route.itemId ?? null)
  );
}
