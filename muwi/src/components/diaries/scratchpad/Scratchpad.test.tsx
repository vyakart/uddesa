import { fireEvent, render, screen, waitFor } from '@/test';
import type { ScratchpadPage as ScratchpadPageType } from '@/types';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { Scratchpad } from './Scratchpad';

vi.mock('./ScratchpadPage', () => ({
  ScratchpadPage: () => <div data-testid="scratchpad-page-view">Scratchpad Page</div>,
}));

vi.mock('./PageStack', () => ({
  PageStack: () => <div data-testid="scratchpad-page-stack">Page Stack</div>,
}));

vi.mock('./CategoryPicker', () => ({
  CategoryPicker: () => <div data-testid="scratchpad-category-picker">Category Picker</div>,
}));

function makePage(overrides: Partial<ScratchpadPageType> = {}): ScratchpadPageType {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    pageNumber: 1,
    categoryColor: '#BBDEFB',
    categoryName: 'notes',
    textBlockIds: [],
    createdAt: now,
    modifiedAt: now,
    isLocked: false,
    ...overrides,
  };
}

describe('Scratchpad', () => {
  beforeEach(() => {
    useScratchpadStore.setState(useScratchpadStore.getInitialState(), true);
  });

  it('loads pages on mount and shows page stack, category picker, and page count', async () => {
    const pageOne = makePage({ pageNumber: 1 });
    const pageTwo = makePage({ pageNumber: 2 });
    const loadPages = vi.fn().mockResolvedValue(undefined);

    useScratchpadStore.setState({
      pages: [pageOne, pageTwo],
      currentPageIndex: 0,
      textBlocks: new Map([[pageOne.id, []], [pageTwo.id, []]]),
      isLoading: false,
      error: null,
      loadPages,
      createPage: vi.fn().mockResolvedValue(pageTwo),
      navigateToPage: vi.fn(),
      updatePageCategory: vi.fn().mockResolvedValue(undefined),
      findFreshPage: vi.fn().mockResolvedValue(1),
    });

    render(<Scratchpad />);

    await waitFor(() => {
      expect(loadPages).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('scratchpad-page-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('scratchpad-page-stack')).toBeInTheDocument();
    expect(screen.getByTestId('scratchpad-category-picker')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts and new page button', async () => {
    const pageOne = makePage({ pageNumber: 1 });
    const pageTwo = makePage({ pageNumber: 2 });
    const loadPages = vi.fn().mockResolvedValue(undefined);
    const createPage = vi.fn().mockResolvedValue(pageTwo);
    const navigateToPage = vi.fn();
    const findFreshPage = vi.fn().mockResolvedValue(1);

    useScratchpadStore.setState({
      pages: [pageOne, pageTwo],
      currentPageIndex: 0,
      textBlocks: new Map([[pageOne.id, []], [pageTwo.id, []]]),
      isLoading: false,
      error: null,
      loadPages,
      createPage,
      navigateToPage,
      updatePageCategory: vi.fn().mockResolvedValue(undefined),
      findFreshPage,
    });

    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByTestId('scratchpad-page-view')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(navigateToPage).toHaveBeenCalledWith(1);

    fireEvent.keyDown(window, { key: 'PageUp' });
    expect(navigateToPage).not.toHaveBeenCalledWith(-1);

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));
    expect(createPage).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: 'f', ctrlKey: true, shiftKey: true });
    expect(findFreshPage).toHaveBeenCalledTimes(1);
  });
});
