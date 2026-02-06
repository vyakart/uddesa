import { fireEvent, render, screen, waitFor } from '@/test';
import type { Draft } from '@/types/drafts';
import { useDraftsStore } from '@/stores/draftsStore';
import { DraftList } from './DraftList';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Draft Title',
    content: '<p>This is a draft preview</p>',
    status: 'in-progress',
    wordCount: 5,
    tags: [],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('DraftList', () => {
  beforeEach(() => {
    useDraftsStore.setState(useDraftsStore.getInitialState(), true);
  });

  it('lists drafts with preview, status badge, word count, and sort controls', () => {
    const draft = makeDraft({ title: 'My Draft', wordCount: 42 });
    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: draft.id,
      sortBy: 'modifiedAt',
      sortOrder: 'desc',
      filterStatus: 'all',
    });

    render(<DraftList onCreateNew={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'My Draft' })).toBeInTheDocument();
    expect(screen.getByText('This is a draft preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByText('42 words')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modified' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('selects draft on click and updates sort/filter actions', () => {
    const draft = makeDraft({ title: 'Selectable Draft' });
    const setCurrentDraft = vi.fn();
    const setSortBy = vi.fn();
    const setSortOrder = vi.fn();
    const setFilterStatus = vi.fn();

    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: null,
      sortBy: 'modifiedAt',
      sortOrder: 'desc',
      filterStatus: 'all',
      setCurrentDraft,
      setSortBy,
      setSortOrder,
      setFilterStatus,
    });

    render(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.click(screen.getByRole('heading', { name: 'Selectable Draft' }));
    expect(setCurrentDraft).toHaveBeenCalledWith(draft.id);

    fireEvent.click(screen.getByRole('button', { name: 'Modified' }));
    fireEvent.click(screen.getByRole('button', { name: 'Title' }));
    expect(setSortBy).toHaveBeenCalledWith('title');
    expect(setSortOrder).toHaveBeenCalledWith('desc');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(setFilterStatus).toHaveBeenCalledWith('review');
  });

  it('opens context menu on right-click and deletes draft', async () => {
    const draft = makeDraft({ title: 'Deletable Draft' });
    const deleteDraft = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: draft.id,
      deleteDraft,
    });

    render(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Deletable Draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteDraft).toHaveBeenCalledWith(draft.id);
    });

    confirmSpy.mockRestore();
  });
});
