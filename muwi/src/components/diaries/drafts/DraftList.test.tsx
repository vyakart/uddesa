import { act, fireEvent, render, screen, waitFor } from '@/test';
import type { Draft } from '@/types/drafts';
import { useDraftsStore } from '@/stores/draftsStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
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

  it('locks and unlocks drafts from context menu with passkey prompt flow', async () => {
    const draft = makeDraft({ id: 'lock-target', title: 'Lockable Draft', isLocked: false });
    const updateDraft = vi.fn().mockResolvedValue(undefined);

    useSettingsStore.setState({
      hasPasskey: vi.fn().mockResolvedValue(true),
      verifyPasskey: vi.fn().mockImplementation(async (passkey: string) => passkey === 'correct-pass'),
      global: {
        ...useSettingsStore.getState().global,
        passkeyHint: 'pet name',
      },
    });
    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: draft.id,
      updateDraft,
    });

    const { rerender } = render(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Lockable Draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith('lock-target', { isLocked: true });
    });

    act(() => {
      useDraftsStore.setState({
        drafts: [{ ...draft, isLocked: true }],
      });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Lockable Draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(screen.getByRole('dialog', { name: 'Unlock draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show hint' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid passkey');
    });

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'correct-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith('lock-target', { isLocked: false });
    });
  });

  it('prompts passkey setup when trying to lock without passkey', async () => {
    const draft = makeDraft({ id: 'no-passkey', title: 'Needs Passkey' });
    const closeDiary = vi.fn();
    const openSettings = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    useSettingsStore.setState({
      hasPasskey: vi.fn().mockResolvedValue(false),
    });
    useAppStore.setState({
      closeDiary,
      openSettings,
    });
    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: draft.id,
    });

    render(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Needs Passkey' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });
    expect(closeDiary).toHaveBeenCalledTimes(1);
    expect(openSettings).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('handles empty states for all/filter views and closes menus on outside click', () => {
    useDraftsStore.setState({
      drafts: [],
      currentDraftId: null,
      sortBy: 'modifiedAt',
      sortOrder: 'desc',
      filterStatus: 'all',
    });

    const { rerender } = render(<DraftList onCreateNew={vi.fn()} />);
    expect(screen.getByText('No drafts yet')).toBeInTheDocument();

    const draft = makeDraft({ status: 'in-progress' });
    act(() => {
      useDraftsStore.setState({
        drafts: [draft],
        filterStatus: 'review',
      });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);
    expect(screen.getByText('No drafts match filter')).toBeInTheDocument();

    act(() => {
      useDraftsStore.setState({
        drafts: [draft],
        filterStatus: 'all',
      });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modified' }));
    expect(screen.getByRole('button', { name: 'Title' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByRole('heading', { name: draft.title }));
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Title' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('supports sort branches, date formatting branches, and hover styling handlers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));

    const now = new Date('2026-02-10T12:00:00.000Z');
    const d1 = makeDraft({
      id: 'd1',
      title: 'Beta',
      status: 'complete',
      modifiedAt: now,
      createdAt: new Date('2026-02-09T12:00:00.000Z'),
      content: '<p>' + 'x'.repeat(100) + '</p>',
    });
    const d2 = makeDraft({
      id: 'd2',
      title: 'Alpha',
      status: 'in-progress',
      modifiedAt: new Date('2026-02-09T12:00:00.000Z'),
      createdAt: new Date('2026-02-08T12:00:00.000Z'),
      content: '',
      isLocked: true,
    });
    const d3 = makeDraft({
      id: 'd3',
      title: 'Gamma',
      status: 'review',
      modifiedAt: new Date('2026-02-07T12:00:00.000Z'),
      createdAt: new Date('2026-02-07T12:00:00.000Z'),
    });
    const d4 = makeDraft({
      id: 'd4',
      title: '',
      status: 'review',
      modifiedAt: new Date('2026-01-31T12:00:00.000Z'),
      createdAt: new Date('2026-01-31T12:00:00.000Z'),
      content: '',
    });

    useDraftsStore.setState({
      drafts: [d1, d2, d3, d4],
      currentDraftId: 'd2',
      sortBy: 'title',
      sortOrder: 'asc',
      filterStatus: 'all',
      setCurrentDraft: vi.fn(),
      cycleDraftStatus: vi.fn(),
    });

    const { rerender } = render(<DraftList onCreateNew={vi.fn()} />);
    const byTitle = screen.getAllByRole('heading').map(h => h.textContent);
    expect(byTitle[0]).toBe('Untitled Draft');
    expect(byTitle[1]).toBe('Alpha');
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
    expect(screen.getAllByText('No content').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\.{3}$/).length).toBeGreaterThan(0);

    act(() => {
      useDraftsStore.setState({ sortBy: 'createdAt', sortOrder: 'desc' });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Beta');

    act(() => {
      useDraftsStore.setState({ sortBy: 'status', sortOrder: 'asc' });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Alpha');

    act(() => {
      useDraftsStore.setState({ sortBy: 'modifiedAt', sortOrder: 'desc' });
    });
    rerender(<DraftList onCreateNew={vi.fn()} />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('Beta');

    const newDraftButton = screen.getByRole('button', { name: 'New Draft' });
    fireEvent.mouseEnter(newDraftButton);
    expect(newDraftButton).toHaveStyle({ backgroundColor: 'var(--color-accent-hover)' });
    fireEvent.mouseLeave(newDraftButton);
    expect(newDraftButton).toHaveStyle({ backgroundColor: 'var(--color-accent-default)' });

    const unselectedHeading = screen.getByRole('heading', { name: 'Gamma' });
    const unselectedCard = unselectedHeading.parentElement?.parentElement;
    if (!unselectedCard) throw new Error('Expected unselected draft card');
    fireEvent.mouseEnter(unselectedCard);
    expect(unselectedCard).toHaveStyle({ backgroundColor: 'var(--color-bg-tertiary)' });
    fireEvent.mouseLeave(unselectedCard);
    expect(unselectedCard).not.toHaveStyle({ backgroundColor: 'var(--color-bg-tertiary)' });

    const selectedHeading = screen.getByRole('heading', { name: 'Alpha' });
    const selectedCard = selectedHeading.parentElement?.parentElement;
    if (!selectedCard) throw new Error('Expected selected draft card');
    fireEvent.mouseEnter(selectedCard);
    expect(selectedCard).toHaveStyle({ backgroundColor: 'var(--color-accent-subtle)' });
    fireEvent.mouseLeave(selectedCard);
    expect(selectedCard).toHaveStyle({ backgroundColor: 'var(--color-accent-subtle)' });

    vi.useRealTimers();
  });

  it('toggles sort order when selecting the current sort and supports status click/delete cancel paths', async () => {
    const setSortOrder = vi.fn();
    const setCurrentDraft = vi.fn();
    const cycleDraftStatus = vi.fn();
    const deleteDraft = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const draft = makeDraft({ id: 'toggle', title: 'Toggle Draft' });
    useDraftsStore.setState({
      drafts: [draft],
      currentDraftId: null,
      sortBy: 'title',
      sortOrder: 'desc',
      filterStatus: 'all',
      setSortOrder,
      setCurrentDraft,
      cycleDraftStatus,
      deleteDraft,
    });

    render(<DraftList onCreateNew={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Title' }));
    const titleButtons = screen.getAllByRole('button', { name: /Title/ });
    fireEvent.click(titleButtons[titleButtons.length - 1]);
    expect(setSortOrder).toHaveBeenCalledWith('asc');

    fireEvent.click(screen.getByRole('button', { name: 'In Progress' }));
    expect(cycleDraftStatus).toHaveBeenCalledWith('toggle');
    expect(setCurrentDraft).not.toHaveBeenCalled();

    fireEvent.contextMenu(screen.getByRole('heading', { name: 'Toggle Draft' }));
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.mouseEnter(deleteButton);
    expect(deleteButton).toHaveStyle({ backgroundColor: 'var(--color-error-subtle)' });
    fireEvent.mouseLeave(deleteButton);
    expect(deleteButton).not.toHaveStyle({ backgroundColor: 'var(--color-error-subtle)' });
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(deleteDraft).not.toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });
});
