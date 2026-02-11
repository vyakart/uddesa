import { act, render, screen, waitFor } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import type { BlackboardCanvas } from '@/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { ExcalidrawWrapper } from './ExcalidrawWrapper';

const { mockApi, excalidrawPropsRef } = vi.hoisted(() => ({
  mockApi: {
    updateScene: vi.fn(),
  },
  excalidrawPropsRef: {
    current: null as
      | null
      | {
          excalidrawAPI?: (api: unknown) => void;
          onChange: (elements: readonly ExcalidrawElement[]) => void;
          theme: 'light' | 'dark';
          gridModeEnabled: boolean;
          initialData: {
            elements: ExcalidrawElement[];
            appState: {
              viewBackgroundColor: string;
              gridSize?: number;
            };
          };
        },
  },
}));

vi.mock('@excalidraw/excalidraw', () => ({
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
  } as unknown as ExcalidrawElement;
}

describe('ExcalidrawWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
    excalidrawPropsRef.current = null;
  });

  it('passes initial scene settings and updates Excalidraw app state from store settings', async () => {
    const saveElements = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas({
        settings: {
          backgroundColor: '#2D3436',
          showGrid: true,
          gridSize: 32,
          defaultStrokeColor: '#F5F5F5',
          defaultStrokeWidth: 2,
          fonts: ['Inter'],
        },
      }),
      elements: [makeTextElement('t-1', '# Heading', 10, 20)],
      saveElements,
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

    await waitFor(() => {
      expect(mockApi.updateScene).toHaveBeenCalledWith({
        appState: {
          viewBackgroundColor: '#2D3436',
          gridSize: 32,
        },
      });
    });
  });

  it('ignores first onChange, then debounces save and calls onElementsChange', async () => {
    vi.useFakeTimers();
    const onElementsChange = vi.fn();
    const saveElements = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      elements: [],
      saveElements,
    });

    render(<ExcalidrawWrapper onElementsChange={onElementsChange} />);

    const firstBatch = [makeTextElement('t-1', '# First', 0, 0)];
    const secondBatch = [makeTextElement('t-2', '## Second', 10, 10)];

    act(() => {
      excalidrawPropsRef.current?.onChange(firstBatch);
    });
    expect(onElementsChange).not.toHaveBeenCalled();
    expect(saveElements).not.toHaveBeenCalled();

    act(() => {
      excalidrawPropsRef.current?.onChange(secondBatch);
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
    vi.useRealTimers();
  });

  it('cleans up pending debounced save on unmount', () => {
    vi.useFakeTimers();
    const saveElements = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      elements: [],
      saveElements,
    });

    const { unmount } = render(<ExcalidrawWrapper />);

    act(() => {
      excalidrawPropsRef.current?.onChange([makeTextElement('t-1', '# First', 0, 0)]);
      excalidrawPropsRef.current?.onChange([makeTextElement('t-2', '# Second', 10, 10)]);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(saveElements).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
