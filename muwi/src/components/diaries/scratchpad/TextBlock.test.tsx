import { fireEvent, render, screen, waitFor } from '@/test';
import type { TextBlock as TextBlockType } from '@/types';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { TextBlock } from './TextBlock';

function makeBlock(overrides: Partial<TextBlockType> = {}): TextBlockType {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: 'block-1',
    pageId: 'page-1',
    content: 'Hello block',
    position: { x: 10, y: 20 },
    width: 'auto',
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function mockRect() {
  return {
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    top: 0,
    left: 0,
    right: 120,
    bottom: 40,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('TextBlock', () => {
  beforeEach(() => {
    useScratchpadStore.setState(useScratchpadStore.getInitialState(), true);
  });

  it('renders at x/y coordinates, is contentEditable, and shows focus ring', async () => {
    useScratchpadStore.setState({
      updateTextBlock: vi.fn().mockResolvedValue(undefined),
      deleteTextBlock: vi.fn().mockResolvedValue(undefined),
    });

    render(<TextBlock block={makeBlock()} />);

    const editable = screen.getByText('Hello block');
    const wrapper = editable.parentElement as HTMLElement;

    expect(wrapper).toHaveStyle({ left: '10px', top: '20px', width: 'auto' });
    expect(editable).toHaveAttribute('contenteditable', 'true');

    fireEvent.focus(editable);
    await waitFor(() => {
      expect(wrapper.className).toContain('ring-2');
    });
  });

  it('updates store on blur and deletes when empty', () => {
    const updateTextBlock = vi.fn().mockResolvedValue(undefined);
    const deleteTextBlock = vi.fn().mockResolvedValue(undefined);
    useScratchpadStore.setState({
      updateTextBlock,
      deleteTextBlock,
    });

    const { rerender } = render(<TextBlock block={makeBlock()} />);
    const editable = screen.getByText('Hello block');

    fireEvent.focus(editable);
    Object.defineProperty(editable, 'innerText', {
      value: 'Updated text',
      configurable: true,
    });
    fireEvent.input(editable);
    fireEvent.blur(editable);
    expect(updateTextBlock).toHaveBeenCalledWith('block-1', { content: 'Updated text' });

    rerender(<TextBlock block={makeBlock({ content: 'Another' })} />);
    const editable2 = screen.getByText('Another');
    fireEvent.focus(editable2);
    Object.defineProperty(editable2, 'innerText', {
      value: '   ',
      configurable: true,
    });
    fireEvent.input(editable2);
    fireEvent.blur(editable2);
    expect(deleteTextBlock).toHaveBeenCalledWith('block-1');
  });

  it('supports edge dragging and updates position', () => {
    const updateTextBlock = vi.fn().mockResolvedValue(undefined);
    useScratchpadStore.setState({
      updateTextBlock,
      deleteTextBlock: vi.fn().mockResolvedValue(undefined),
    });

    render(<TextBlock block={makeBlock()} />);
    const editable = screen.getByText('Hello block');
    const wrapper = editable.parentElement as HTMLElement;
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());

    fireEvent.mouseDown(wrapper, { clientX: 1, clientY: 1 });
    fireEvent.mouseMove(document, { clientX: 21, clientY: 31 });
    fireEvent.mouseUp(document);

    expect(updateTextBlock).toHaveBeenCalledWith('block-1', {
      position: { x: 30, y: 50 },
    });
  });

  it('shows lock indicator and disables editing when page is locked', () => {
    useScratchpadStore.setState({
      updateTextBlock: vi.fn().mockResolvedValue(undefined),
      deleteTextBlock: vi.fn().mockResolvedValue(undefined),
    });

    const { container } = render(<TextBlock block={makeBlock()} isPageLocked />);
    const editable = screen.getByText('Hello block');
    expect(editable).toHaveAttribute('contenteditable', 'false');
    expect(container.querySelector('.text-gray-400')).toBeInTheDocument();
  });
});
