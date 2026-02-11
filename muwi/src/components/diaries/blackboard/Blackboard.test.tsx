import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { Blackboard } from './Blackboard';

vi.mock('@/components/common', () => ({
  DiaryLayout: ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => (
    <div data-testid="blackboard-layout">
      <div data-testid="blackboard-layout-toolbar">{toolbar}</div>
      <div data-testid="blackboard-layout-content">{children}</div>
    </div>
  ),
}));

vi.mock('./ExcalidrawWrapper', () => ({
  ExcalidrawWrapper: ({ onElementsChange }: { onElementsChange?: () => void }) => (
    <button
      type="button"
      data-testid="excalidraw-wrapper"
      onClick={() => onElementsChange?.()}
    >
      Excalidraw Wrapper
    </button>
  ),
}));

vi.mock('./IndexPanel', () => ({
  IndexPanel: ({
    isCollapsed,
    onToggleCollapse,
  }: {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
  }) => (
    <button
      type="button"
      data-testid="index-panel"
      onClick={onToggleCollapse}
    >
      {isCollapsed ? 'Index Collapsed' : 'Index Expanded'}
    </button>
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
  });

  it('loads on mount, rebuilds index on canvas change, and cycles index visibility states', async () => {
    const loadCanvas = vi.fn().mockResolvedValue(undefined);
    const rebuildIndex = vi.fn();

    useBlackboardStore.setState({
      isLoading: false,
      error: null,
      loadCanvas,
      rebuildIndex,
    });

    render(<Blackboard />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(loadCanvas).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('blackboard-toolbar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('excalidraw-wrapper'));
    expect(rebuildIndex).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('index-panel')).toHaveTextContent('Index Expanded');
    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.getByTestId('index-panel')).toHaveTextContent('Index Collapsed');

    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.queryByTestId('index-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('blackboard-toolbar'));
    expect(screen.getByTestId('index-panel')).toHaveTextContent('Index Expanded');
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
});
