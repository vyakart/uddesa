import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { Blackboard } from './Blackboard';

const wrapperPropsRef = {
  current: null as null | {
    onElementsChange?: () => void;
    navigationTarget?: {
      elementId: string;
      position: { x: number; y: number };
      requestedAt: number;
    } | null;
  },
};

vi.mock('@/components/common', () => ({
  DiaryLayout: ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => (
    <div data-testid="blackboard-layout">
      <div data-testid="blackboard-layout-toolbar">{toolbar}</div>
      <div data-testid="blackboard-layout-content">{children}</div>
    </div>
  ),
  FontSelector: ({
    fonts,
    value,
    onChange,
  }: {
    fonts: string[];
    value: string;
    onChange: (font: string) => void;
  }) => (
    <div data-testid="mock-font-selector" data-value={value}>
      {fonts.map((font) => (
        <button key={font} type="button" onClick={() => onChange(font)}>
          {font}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./ExcalidrawWrapper', () => ({
  ExcalidrawWrapper: ({
    onElementsChange,
    navigationTarget,
  }: {
    onElementsChange?: () => void;
    navigationTarget?: {
      elementId: string;
      position: { x: number; y: number };
      requestedAt: number;
    } | null;
  }) => {
    wrapperPropsRef.current = { onElementsChange, navigationTarget };
    return (
    <button
      type="button"
      data-testid="excalidraw-wrapper"
      onClick={() => onElementsChange?.()}
    >
      Excalidraw Wrapper
    </button>
    );
  },
}));

vi.mock('./IndexPanel', () => ({
  IndexPanel: ({
    isCollapsed,
    onToggleCollapse,
    onNavigateToElement,
  }: {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNavigateToElement?: (elementId: string, position: { x: number; y: number }) => void;
  }) => (
    <div data-testid="index-panel">
      <button type="button" data-testid="index-panel-collapse" onClick={onToggleCollapse}>
        {isCollapsed ? 'Index Collapsed' : 'Index Expanded'}
      </button>
      <button
        type="button"
        data-testid="index-panel-nav"
        onClick={() => onNavigateToElement?.('heading-1', { x: 320, y: 240 })}
      >
        Navigate
      </button>
    </div>
  ),
}));

vi.mock('./BlackboardToolbar', () => ({
  BlackboardToolbar: ({
    isIndexVisible,
    onToggleIndex,
  }: {
    isIndexVisible: boolean;
    onToggleIndex: () => void;
  }) => (
    <button
      type="button"
      data-testid="blackboard-toolbar"
      onClick={onToggleIndex}
    >
      {isIndexVisible ? 'Index Visible' : 'Index Hidden'}
    </button>
  ),
}));

describe('Blackboard', () => {
  beforeEach(() => {
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
    wrapperPropsRef.current = null;
  });

  it('loads on mount, rebuilds index on canvas change, and cycles index visibility states', async () => {
    const loadCanvas = vi.fn().mockResolvedValue(undefined);
    const rebuildIndex = vi.fn();

    useBlackboardStore.setState({
      isLoading: false,
      error: null,
      canvas: {
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
          fonts: ['Inter', 'Caveat'],
          defaultFont: 'Inter',
        },
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
        modifiedAt: new Date('2026-02-11T00:00:00.000Z'),
      },
      loadCanvas,
      rebuildIndex,
      updateSettings: vi.fn().mockResolvedValue(undefined),
    });

    render(<Blackboard />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(loadCanvas).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('blackboard-toolbar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('excalidraw-wrapper'));
    expect(rebuildIndex).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('index-panel-collapse')).toHaveTextContent('Index Expanded');
    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.getByTestId('index-panel-collapse')).toHaveTextContent('Index Collapsed');

    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.queryByTestId('index-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.getByTestId('index-panel-collapse')).toHaveTextContent('Index Expanded');

    fireEvent.click(screen.getByTestId('index-panel-nav'));
    await waitFor(() => {
      expect(wrapperPropsRef.current?.navigationTarget?.elementId).toBe('heading-1');
    });
  });

  it('renders error state and supports reload action', async () => {
    const loadCanvas = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      isLoading: false,
      error: 'Canvas failed to load',
      loadCanvas,
      rebuildIndex: vi.fn(),
    });

    render(<Blackboard />);

    await waitFor(() => {
      expect(screen.getByText('Error: Canvas failed to load')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('opens font context menu on right click and updates selected font', async () => {
    const loadCanvas = vi.fn().mockResolvedValue(undefined);
    const updateSettings = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      isLoading: false,
      error: null,
      canvas: {
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
          fonts: ['Inter', 'Caveat'],
          defaultFont: 'Inter',
        },
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
        modifiedAt: new Date('2026-02-11T00:00:00.000Z'),
      },
      loadCanvas,
      rebuildIndex: vi.fn(),
      updateSettings,
    });

    render(<Blackboard />);

    await waitFor(() => {
      expect(screen.getByTestId('blackboard-canvas-container')).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByTestId('blackboard-canvas-container'));
    expect(screen.getByTestId('mock-font-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Caveat' }));
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({ defaultFont: 'Caveat' });
    });
  });
});
