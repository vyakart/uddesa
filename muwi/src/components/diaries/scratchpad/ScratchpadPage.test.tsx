import { fireEvent, render, screen } from '@/test';
import type { ScratchpadPage as ScratchpadPageType, TextBlock as TextBlockType } from '@/types';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ScratchpadPage } from './ScratchpadPage';

vi.mock('./TextBlock', () => ({
  TextBlock: ({ block }: { block: TextBlockType }) => (
    <div data-testid="text-block-mock">{block.id}</div>
  ),
}));

function makePage(): ScratchpadPageType {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: 'page-1',
    pageNumber: 1,
    categoryColor: '#aabbcc',
    categoryName: 'notes',
    textBlockIds: ['block-1', 'block-2'],
    createdAt: now,
    modifiedAt: now,
    isLocked: false,
  };
}

function makeBlock(id: string): TextBlockType {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id,
    pageId: 'page-1',
    content: 'block',
    position: { x: 20, y: 30 },
    width: 'auto',
    fontSize: 16,
    fontFamily: 'Inter',
    createdAt: now,
    modifiedAt: now,
  };
}

describe('ScratchpadPage', () => {
  beforeEach(() => {
    useScratchpadStore.setState(useScratchpadStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('renders fixed 400x600 page canvas with category tint and depth shadows', () => {
    useScratchpadStore.setState({
      createTextBlock: vi.fn().mockResolvedValue(makeBlock('new-block')),
    });

    render(
      <ScratchpadPage
        page={makePage()}
        blocks={[makeBlock('block-1'), makeBlock('block-2')]}
      />
    );

    expect(screen.getByTestId('scratchpad-page-canvas')).toHaveAttribute('data-page-size', '400x600');
    expect(screen.getByTestId('scratchpad-page-canvas')).toHaveAttribute('data-category', 'notes');
    expect(screen.getByTestId('scratchpad-page-shadow-1')).toBeInTheDocument();
    expect(screen.getByTestId('scratchpad-page-shadow-2')).toBeInTheDocument();
    expect(screen.getAllByTestId('text-block-mock')).toHaveLength(2);
  });

  it('creates a new text block when clicking empty page space', () => {
    const createTextBlock = vi.fn().mockResolvedValue(makeBlock('new-block'));
    useScratchpadStore.setState({
      createTextBlock,
    });

    render(<ScratchpadPage page={makePage()} blocks={[]} />);

    const canvas = screen.getByTestId('scratchpad-page-canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      width: 500,
      height: 700,
      top: 20,
      left: 10,
      right: 510,
      bottom: 720,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(canvas, { clientX: 60, clientY: 95 });
    expect(createTextBlock).toHaveBeenCalledWith('page-1', { x: 50, y: 75 });
  });

  it('shows first-use empty-state action and creates a centered block from action button', () => {
    const createTextBlock = vi.fn().mockResolvedValue(makeBlock('new-block'));
    useScratchpadStore.setState({
      createTextBlock,
    });

    render(<ScratchpadPage page={makePage()} blocks={[]} />);

    expect(screen.getByText('Start this page')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add first text block' }));

    expect(createTextBlock).toHaveBeenCalledWith('page-1', { x: 100, y: 168 });
  });
});
