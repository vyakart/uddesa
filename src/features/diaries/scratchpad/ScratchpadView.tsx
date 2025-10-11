import { Suspense, useMemo } from 'react';
import { Canvas } from '../../../editors/excalidraw/Canvas';
import type { Scene } from '../../../editors/excalidraw/excalApi';
import { PageRail } from '../../../ui/PageRail';
import type { DiaryScreenProps } from '../types';
import { useScratchpad } from './useScratchpad';

interface PageRailItem {
  id: string;
  label: string;
  thumbDataUrl?: string;
  background: string;
}

function extractBackground(scene: Scene | undefined): string {
  return (scene?.appState?.viewBackgroundColor as string | undefined) ?? '#f8fafc';
}

export function ScratchpadView({ diary }: DiaryScreenProps) {
  const { pages, activePage, isLoading, error, selectPage, createPage, deletePage, updateScene } =
    useScratchpad(diary);

  const railPages = useMemo<PageRailItem[]>(
    () =>
      pages.map((page, index) => ({
        id: page.id,
        label: `Page ${index + 1}`,
        thumbDataUrl: page.thumbDataUrl,
        background: extractBackground(page.scene),
      })),
    [pages],
  );

  return (
    <div className="scratchpad">
      <aside className="scratchpad__rail">
        <PageRail
          pages={railPages}
          activePageId={activePage?.id ?? null}
          onSelect={selectPage}
          onAdd={() => {
            void createPage();
          }}
          onDelete={(pageId) => {
            void deletePage(pageId);
          }}
          disableDelete={railPages.length <= 1}
        />
      </aside>
      <section className="scratchpad__workspace">
        {isLoading && !activePage ? (
          <div className="scratchpad__status">Loading pages…</div>
        ) : error ? (
          <div className="scratchpad__status scratchpad__status--error">{error}</div>
        ) : activePage ? (
          <Suspense fallback={<div className="scratchpad__status">Loading canvas…</div>}>
            <Canvas
              pageKey={activePage.id}
              scene={activePage.scene}
              onSceneChange={(scene) => updateScene(activePage.id, scene)}
              className="scratchpad__canvas"
            />
          </Suspense>
        ) : (
          <div className="scratchpad__status">No pages yet.</div>
        )}
      </section>
    </div>
  );
}
