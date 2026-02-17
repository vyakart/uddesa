import { fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import type { ScratchpadPage as ScratchpadPageType } from '@/types';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
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

  it('locks and unlocks the current page with passkey prompt flow', async () => {
    const pageOne = makePage({ id: 'page-lock-1', pageNumber: 1 });
    const loadPages = vi.fn().mockResolvedValue(undefined);

    useSettingsStore.setState({
      hasPasskey: vi.fn().mockResolvedValue(true),
      verifyPasskey: vi.fn().mockImplementation(async (passkey: string) => passkey === 'correct-pass'),
      global: {
        ...useSettingsStore.getState().global,
        passkeyHint: 'favorite color',
      },
    });
    useScratchpadStore.setState({
      pages: [pageOne],
      currentPageIndex: 0,
      textBlocks: new Map([[pageOne.id, []]]),
      isLoading: false,
      error: null,
      loadPages,
      createPage: vi.fn().mockResolvedValue(pageOne),
      navigateToPage: vi.fn(),
      updatePageCategory: vi.fn().mockResolvedValue(undefined),
      findFreshPage: vi.fn().mockResolvedValue(0),
    });

    render(<Scratchpad />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Page' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lock Page' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unlock Page' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Unlock Page' }));
    expect(screen.getByRole('dialog', { name: 'Unlock page' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid passkey');
    });

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'correct-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lock Page' })).toBeInTheDocument();
    });
  });
});
