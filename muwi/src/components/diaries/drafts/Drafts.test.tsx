import { act, fireEvent, render, screen, waitFor } from '@/test';
import type { Draft } from '@/types/drafts';
import { useDraftsStore } from '@/stores/draftsStore';
import { Drafts } from './Drafts';

vi.mock('./DraftEditor', () => ({
  DraftEditor: ({
    draft,
    onTitleChange,
    onContentChange,
    onStatusCycle,
  }: {
    draft: { title: string } | null;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onStatusCycle: () => void;
  }) => (
    <div data-testid="draft-editor-view">
      {draft?.title ?? 'No draft selected'}
      <button onClick={() => onTitleChange('Changed Title')}>Mock Title Change</button>
      <button onClick={() => onContentChange('<p>Changed Content</p>')}>Mock Content Change</button>
      <button onClick={onStatusCycle}>Mock Cycle Status</button>
    </div>
  ),
}));

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    title: 'Draft Alpha',
    content: '<p>draft content</p>',
    status: 'in-progress',
    wordCount: 2,
    tags: [],
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function seedStore(draft: Draft) {
  const initial = useDraftsStore.getInitialState();
  const loadDrafts = vi.fn().mockResolvedValue(undefined);
  const createDraft = vi.fn().mockResolvedValue(makeDraft({ title: 'New Draft' }));
  const updateDraft = vi.fn().mockResolvedValue(undefined);
  const cycleDraftStatus = vi.fn().mockResolvedValue(undefined);
  const deleteDraft = vi.fn().mockResolvedValue(undefined);

  useDraftsStore.setState({
    ...initial,
    drafts: [draft],
    currentDraftId: draft.id,
    isLoading: false,
    error: null,
    loadDrafts,
    createDraft,
    updateDraft,
    cycleDraftStatus,
    deleteDraft,
  });

  return { loadDrafts, createDraft, deleteDraft };
}

describe('Drafts', () => {
  beforeEach(() => {
    useDraftsStore.setState(useDraftsStore.getInitialState(), true);
  });

  it('loads drafts on mount and renders list + selected draft editor', async () => {
    const draft = makeDraft();
    const { loadDrafts } = seedStore(draft);

    render(<Drafts />);

    await waitFor(() => {
      expect(loadDrafts).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('button', { name: 'New Draft' })).toBeInTheDocument();
    expect(screen.getByTestId('draft-editor-view')).toHaveTextContent('Draft Alpha');
  });

  it('handles creating new drafts from button and keyboard shortcut', async () => {
    const draft = makeDraft();
    const { createDraft } = seedStore(draft);

    render(<Drafts />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New Draft' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'New Draft' }));
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });

    expect(createDraft).toHaveBeenCalledTimes(2);
  });

  it('handles deleting drafts through the list context menu', async () => {
    const draft = makeDraft({ title: 'Delete Me' });
    const { deleteDraft } = seedStore(draft);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Drafts />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Delete Me' })).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Delete Me' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteDraft).toHaveBeenCalledWith(draft.id);
    });

    confirmSpy.mockRestore();
  });

  it('renders loading and error states and retries from error view', async () => {
    const loadDrafts = vi.fn().mockResolvedValue(undefined);

    useDraftsStore.setState({
      ...useDraftsStore.getInitialState(),
      isLoading: true,
      loadDrafts,
    });
    const { rerender } = render(<Drafts />);
    expect(screen.getByText('Loading drafts...')).toBeInTheDocument();

    act(() => {
      useDraftsStore.setState({
        ...useDraftsStore.getInitialState(),
        isLoading: false,
        error: 'boom',
        loadDrafts,
      });
    });
    rerender(<Drafts />);
    expect(screen.getByText('Error loading drafts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(loadDrafts).toHaveBeenCalled();
  });

  it('wires title/content/status callbacks only when current draft id exists', async () => {
    const draft = makeDraft({ id: 'draft-a', title: 'Draft A' });
    const updateDraft = vi.fn().mockResolvedValue(undefined);
    const cycleDraftStatus = vi.fn().mockResolvedValue(undefined);

    useDraftsStore.setState({
      ...useDraftsStore.getInitialState(),
      drafts: [draft],
      currentDraftId: draft.id,
      updateDraft,
      cycleDraftStatus,
      loadDrafts: vi.fn().mockResolvedValue(undefined),
    });

    const { rerender } = render(<Drafts />);
    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Cycle Status' }));

    expect(updateDraft).toHaveBeenCalledWith('draft-a', { title: 'Changed Title' });
    expect(updateDraft).toHaveBeenCalledWith('draft-a', { content: '<p>Changed Content</p>' });
    expect(cycleDraftStatus).toHaveBeenCalledWith('draft-a');

    act(() => {
      useDraftsStore.setState({
        ...useDraftsStore.getState(),
        currentDraftId: null,
      });
    });
    rerender(<Drafts />);

    fireEvent.click(screen.getByRole('button', { name: 'Mock Title Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Content Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mock Cycle Status' }));

    expect(updateDraft).toHaveBeenCalledTimes(2);
    expect(cycleDraftStatus).toHaveBeenCalledTimes(1);
  });

  it('shows singular/plural draft count in toolbar', () => {
    const one = makeDraft({ id: 'one' });
    const two = makeDraft({ id: 'two', title: 'Two' });
    useDraftsStore.setState({
      ...useDraftsStore.getInitialState(),
      drafts: [one],
      currentDraftId: one.id,
      loadDrafts: vi.fn().mockResolvedValue(undefined),
    });

    const { rerender } = render(<Drafts />);
    expect(screen.getByText('1 draft')).toBeInTheDocument();

    act(() => {
      useDraftsStore.setState({
        ...useDraftsStore.getState(),
        drafts: [one, two],
      });
    });
    rerender(<Drafts />);
    expect(screen.getByText('2 drafts')).toBeInTheDocument();
  });
});
