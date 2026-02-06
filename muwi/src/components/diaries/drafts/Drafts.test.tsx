import { fireEvent, render, screen, waitFor } from '@/test';
import type { Draft } from '@/types/drafts';
import { useDraftsStore } from '@/stores/draftsStore';
import { Drafts } from './Drafts';

vi.mock('./DraftEditor', () => ({
  DraftEditor: ({ draft }: { draft: { title: string } | null }) => (
    <div data-testid="draft-editor-view">{draft?.title ?? 'No draft selected'}</div>
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
});
