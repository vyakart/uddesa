import { fireEvent, render, screen } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import type { IndexEntry } from '@/types';
import { IndexPanel } from './IndexPanel';

function makeEntry(overrides: Partial<IndexEntry> = {}): IndexEntry {
  return {
    id: 'index-1',
    elementId: 'el-1',
    title: 'Heading 1',
    level: 1,
    position: { x: 100, y: 200 },
    ...overrides,
  };
}

describe('IndexPanel', () => {
  beforeEach(() => {
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
  });

  it('renders collapsed state and toggles collapse', () => {
    const onToggleCollapse = vi.fn();

    render(<IndexPanel isCollapsed onToggleCollapse={onToggleCollapse} />);

    expect(screen.queryByText('Index')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Expand index'));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('shows empty-state guidance when no headings exist', () => {
    const onToggleCollapse = vi.fn();
    useBlackboardStore.setState({ index: [] });

    render(<IndexPanel isCollapsed={false} onToggleCollapse={onToggleCollapse} />);

    expect(screen.getByText('Index')).toBeInTheDocument();
    expect(screen.getByText('No headings found')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Collapse index'));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders heading hierarchy and navigates on click', () => {
    const onNavigateToElement = vi.fn();
    useBlackboardStore.setState({
      index: [
        makeEntry({ id: 'index-a', elementId: 'a', title: 'H1 Title', level: 1 }),
        makeEntry({ id: 'index-b', elementId: 'b', title: 'H2 Title', level: 2 }),
        makeEntry({ id: 'index-c', elementId: 'c', title: 'H3 Title', level: 3 }),
      ],
    });

    render(
      <IndexPanel
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onNavigateToElement={onNavigateToElement}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'H2 Title' }));
    expect(onNavigateToElement).toHaveBeenCalledWith('b', { x: 100, y: 200 });
    expect(screen.getByText('3 headings')).toBeInTheDocument();
  });
});
