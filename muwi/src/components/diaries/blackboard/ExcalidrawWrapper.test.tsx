import { act, render, screen, waitFor } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import type { BlackboardCanvas } from '@/types';
import { FONT_FAMILY } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import { ExcalidrawWrapper } from './ExcalidrawWrapper';

const { mockApi, excalidrawPropsRef, selectedElementIdsRef, sceneElementsRef } = vi.hoisted(() => {
  const selectedElementIdsRef = { current: {} as Record<string, boolean> };
  const sceneElementsRef = { current: [] as ExcalidrawElement[] };

  return {
    mockApi: {
      updateScene: vi.fn(),
      getAppState: vi.fn(() => ({ selectedElementIds: selectedElementIdsRef.current })),
      getSceneElements: vi.fn(() => sceneElementsRef.current),
    },
    excalidrawPropsRef: {
      current: null as
        | null
        | {
            excalidrawAPI?: (api: unknown) => void;
            onChange: (elements: readonly ExcalidrawElement[], appState: AppState) => void;
            navigationTarget?: {
              elementId: string;
              position: { x: number; y: number };
              requestedAt: number;
            } | null;
            onNavigationHandled?: () => void;
            theme: 'light' | 'dark';
            gridModeEnabled: boolean;
            initialData: {
              elements: ExcalidrawElement[];
              appState: {
                viewBackgroundColor: string;
                gridSize?: number;
                scrollX: number;
                scrollY: number;
                zoom: { value: number };
                currentItemFontFamily: number;
              };
            };
          },
    },
    selectedElementIdsRef,
    sceneElementsRef,
  };
});

vi.mock('@excalidraw/excalidraw', () => ({
  FONT_FAMILY: {
    Helvetica: 2,
    Cascadia: 3,
    Nunito: 6,
    'Comic Shanns': 8,
  },
  Excalidraw: (
    props: typeof excalidrawPropsRef.current & { excalidrawAPI?: (api: unknown) => void }
  ) => {
    excalidrawPropsRef.current = props;
    return <div data-testid="mock-excalidraw" />;
  },
}));

function makeCanvas(overrides: Partial<BlackboardCanvas> = {}): BlackboardCanvas {
  const now = new Date('2026-02-11T00:00:00.000Z');
  return {
    id: 'canvas-1',
    name: 'Canvas',
    elementIds: [],
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    index: [],
    settings: {
      backgroundColor: '#fdfbf7',
      showGrid: false,
      gridSize: 20,
      defaultStrokeColor: '#F5F5F5',
      defaultStrokeWidth: 2,
      fonts: ['Inter'],
      defaultFont: 'Inter',
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeTextElement(
  id: string,
  text: string,
  x: number,
  y: number
): ExcalidrawElement {
  return {
    id,
    type: 'text',
    x,
    y,
    text,
    fontFamily: FONT_FAMILY.Helvetica,
    version: 1,
  } as unknown as ExcalidrawElement;
}

describe('ExcalidrawWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
    excalidrawPropsRef.current = null;
    selectedElementIdsRef.current = {};
    sceneElementsRef.current = [];
  });

  it('passes initial scene settings and updates Excalidraw app state from store settings', async () => {
    const saveElements = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas({
        viewportState: { panX: 15, panY: 25, zoom: 1.2 },
        settings: {
          backgroundColor: '#2D3436',
          showGrid: true,
          gridSize: 32,
          defaultStrokeColor: '#F5F5F5',
          defaultStrokeWidth: 2,
          fonts: ['Inter'],
          defaultFont: 'Inter',
        },
      }),
      elements: [makeTextElement('t-1', '# Heading', 10, 20)],
      saveElements,
      updateViewport,
    });

    render(<ExcalidrawWrapper />);
    act(() => {
      excalidrawPropsRef.current?.excalidrawAPI?.(mockApi);
    });

    expect(screen.getByTestId('mock-excalidraw')).toBeInTheDocument();
    expect(excalidrawPropsRef.current?.theme).toBe('dark');
    expect(excalidrawPropsRef.current?.gridModeEnabled).toBe(true);
    expect(excalidrawPropsRef.current?.initialData.appState.gridSize).toBe(32);
    expect(excalidrawPropsRef.current?.initialData.appState.viewBackgroundColor).toBe('#2D3436');
    expect(excalidrawPropsRef.current?.initialData.appState.scrollX).toBe(15);
    expect(excalidrawPropsRef.current?.initialData.appState.scrollY).toBe(25);
    expect(excalidrawPropsRef.current?.initialData.appState.zoom).toEqual({ value: 1.2 });
    expect(excalidrawPropsRef.current?.initialData.appState.currentItemFontFamily).toBe(FONT_FAMILY.Helvetica);

    await waitFor(() => {
      expect(mockApi.updateScene).toHaveBeenCalledWith({
        appState: {
          viewBackgroundColor: '#2D3436',
          gridSize: 32,
          currentItemFontFamily: FONT_FAMILY.Helvetica,
        },
      });
    });
  });

  it('ignores first onChange, then debounces save and calls onElementsChange', async () => {
    vi.useFakeTimers();
    const onElementsChange = vi.fn();
    const saveElements = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      elements: [],
      saveElements,
      updateViewport,
    });

    render(<ExcalidrawWrapper onElementsChange={onElementsChange} />);

    const firstBatch = [makeTextElement('t-1', '# First', 0, 0)];
    const secondBatch = [makeTextElement('t-2', '## Second', 10, 10)];
    const appState = {
      scrollX: 111,
      scrollY: 222,
      zoom: { value: 1.4 },
    } as AppState;

    act(() => {
      excalidrawPropsRef.current?.onChange(firstBatch, appState);
    });
    expect(onElementsChange).not.toHaveBeenCalled();
    expect(saveElements).not.toHaveBeenCalled();
    expect(updateViewport).not.toHaveBeenCalled();

    act(() => {
      excalidrawPropsRef.current?.onChange(secondBatch, appState);
    });
    expect(onElementsChange).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(saveElements).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(saveElements).toHaveBeenCalledWith(secondBatch);
    expect(updateViewport).toHaveBeenCalledWith({ panX: 111, panY: 222, zoom: 1.4 });
    vi.useRealTimers();
  });

  it('cleans up pending debounced save on unmount', () => {
    vi.useFakeTimers();
    const saveElements = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      elements: [],
      saveElements,
      updateViewport,
    });

    const { unmount } = render(<ExcalidrawWrapper />);
    const appState = {
      scrollX: 9,
      scrollY: 8,
      zoom: { value: 1.1 },
    } as AppState;

    act(() => {
      excalidrawPropsRef.current?.onChange([makeTextElement('t-1', '# First', 0, 0)], appState);
      excalidrawPropsRef.current?.onChange([makeTextElement('t-2', '# Second', 10, 10)], appState);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(saveElements).not.toHaveBeenCalled();
    expect(updateViewport).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('navigates to requested element position and persists viewport', async () => {
    const updateViewport = vi.fn().mockResolvedValue(undefined);
    const onNavigationHandled = vi.fn();

    useBlackboardStore.setState({
      canvas: makeCanvas({
        viewportState: { panX: 0, panY: 0, zoom: 1.5 },
      }),
      elements: [],
      updateViewport,
    });

    render(
      <ExcalidrawWrapper
        navigationTarget={{
          elementId: 'target-1',
          position: { x: 320, y: 240 },
          requestedAt: Date.now(),
        }}
        onNavigationHandled={onNavigationHandled}
      />
    );
    const wrapperRoot = screen.getByTestId('excalidraw-wrapper-root');
    vi.spyOn(wrapperRoot, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      toJSON: () => ({}),
    } as DOMRect);

    act(() => {
      excalidrawPropsRef.current?.excalidrawAPI?.(mockApi);
    });

    await waitFor(() => {
      expect(mockApi.updateScene).toHaveBeenCalledWith({
        appState: {
          scrollX: 80,
          scrollY: 60,
        },
      });
      expect(updateViewport).toHaveBeenCalledWith({
        panX: 80,
        panY: 60,
        zoom: 1.5,
      });
      expect(onNavigationHandled).toHaveBeenCalledTimes(1);
    });
  });

  it('applies selected default font to selected text elements', async () => {
    const saveElements = vi.fn().mockResolvedValue(undefined);
    sceneElementsRef.current = [makeTextElement('t-selected', 'Selected', 10, 20)];
    selectedElementIdsRef.current = { 't-selected': true };

    useBlackboardStore.setState({
      canvas: makeCanvas({
        settings: {
          backgroundColor: '#fdfbf7',
          showGrid: false,
          gridSize: 20,
          defaultStrokeColor: '#F5F5F5',
          defaultStrokeWidth: 2,
          fonts: ['Inter', 'Caveat'],
          defaultFont: 'Caveat',
        },
      }),
      elements: [],
      saveElements,
      updateViewport: vi.fn().mockResolvedValue(undefined),
    });

    render(<ExcalidrawWrapper />);
    act(() => {
      excalidrawPropsRef.current?.excalidrawAPI?.(mockApi);
    });

    await waitFor(() => {
      expect(mockApi.updateScene).toHaveBeenCalledWith({
        elements: [
          expect.objectContaining({
            id: 't-selected',
            fontFamily: FONT_FAMILY['Comic Shanns'],
          }),
        ],
      });
      expect(saveElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 't-selected',
          fontFamily: FONT_FAMILY['Comic Shanns'],
        }),
      ]);
    });
  });
});
