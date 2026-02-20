import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Section } from '@/types/longDrafts';
import { TableOfContents } from './TableOfContents';

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    longDraftId: 'doc-1',
    title: 'Section',
    content: '',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 0,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('TableOfContents', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  it('renders collapsed TOC state and toggles visibility', () => {
    const toggleTOC = vi.fn();
    useLongDraftsStore.setState({
      isTOCVisible: false,
      toggleTOC,
    });

    render(<TableOfContents onCreateSection={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Show table of contents'));
    expect(toggleTOC).toHaveBeenCalledTimes(1);
  });

  it('renders hierarchy, supports section actions, and context-menu operations', async () => {
    const setCurrentSection = vi.fn();
    const toggleTOC = vi.fn();
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const reorderSections = vi.fn().mockResolvedValue(undefined);
    const onCreateSection = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const root = makeSection({
      id: 'root-1',
      title: 'Introduction',
      order: 0,
      wordCount: 120,
      status: 'in-progress',
    });
    const child = makeSection({
      id: 'child-1',
      title: 'Background',
      parentId: root.id,
      order: 0,
      wordCount: 80,
      status: 'draft',
    });
    const anotherRoot = makeSection({
      id: 'root-2',
      title: 'Methods',
      order: 1,
      wordCount: 200,
      status: 'review',
      isLocked: true,
    });

    useLongDraftsStore.setState({
      currentLongDraftId: 'doc-1',
      currentSectionId: 'root-1',
      isTOCVisible: true,
      sectionsMap: new Map([['doc-1', [root, child, anotherRoot]]]),
      setCurrentSection,
      toggleTOC,
      deleteSection,
      reorderSections,
    });

    render(<TableOfContents onCreateSection={onCreateSection} />);

    expect(screen.getByText('Contents')).toBeInTheDocument();
    expect(screen.getByText('2 sections')).toBeInTheDocument();
    expect(screen.getByText('400 words')).toBeInTheDocument();
    expect(screen.getByTestId('toc-section-root-1')).toHaveClass('muwi-sidebar-item');

    fireEvent.click(screen.getByText('Methods'));
    expect(setCurrentSection).toHaveBeenCalledWith('root-2');

    const methodsRow = screen.getByText('Methods').closest('div');
    const introRow = screen.getByText('Introduction').closest('div');
    expect(methodsRow).toBeTruthy();
    expect(introRow).toBeTruthy();
    fireEvent.dragStart(methodsRow!);
    fireEvent.dragOver(introRow!);
    fireEvent.drop(introRow!);
    await waitFor(() => {
      expect(reorderSections).toHaveBeenCalledWith('doc-1', ['root-2', 'root-1', 'child-1']);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Section' }));
    expect(onCreateSection).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByTitle('Hide table of contents'));
    expect(toggleTOC).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(screen.getByText('Introduction'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Subsection' }));
    expect(onCreateSection).toHaveBeenCalledWith('root-1');

    fireEvent.contextMenu(screen.getByText('Introduction'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Section' }));
    await waitFor(() => {
      expect(deleteSection).toHaveBeenCalledWith('root-1');
    });

    confirmSpy.mockRestore();
  });

  it('renders panel variant even when sidebar toc visibility is false', () => {
    const section = makeSection({
      id: 'panel-root',
      title: 'Panel Root',
      wordCount: 42,
    });

    useLongDraftsStore.setState({
      currentLongDraftId: 'doc-1',
      currentSectionId: section.id,
      isTOCVisible: false,
      sectionsMap: new Map([['doc-1', [section]]]),
      setCurrentSection: vi.fn(),
      toggleTOC: vi.fn(),
      deleteSection: vi.fn().mockResolvedValue(undefined),
      updateSection: vi.fn().mockResolvedValue(undefined),
    });

    render(<TableOfContents onCreateSection={vi.fn()} variant="panel" />);

    expect(screen.getByTestId('long-drafts-toc')).toBeInTheDocument();
    expect(screen.queryByTitle('Show table of contents')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Hide table of contents')).not.toBeInTheDocument();
  });

  it('handles empty document state and context-menu cancel/close paths', async () => {
    const deleteSection = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    useLongDraftsStore.setState({
      currentLongDraftId: null,
      currentSectionId: null,
      isTOCVisible: true,
      sectionsMap: new Map(),
      setCurrentSection: vi.fn(),
      toggleTOC: vi.fn(),
      deleteSection,
    });

    const { rerender } = render(<TableOfContents onCreateSection={vi.fn()} />);
    expect(screen.getByText('0 sections')).toBeInTheDocument();
    expect(screen.getByText('0 words')).toBeInTheDocument();

    const root = makeSection({ id: 'root-cancel', title: 'Cancelable Root' });
    const child = makeSection({
      id: 'child-expand',
      title: 'Hidden Child',
      parentId: root.id,
      order: 0,
      status: 'custom-status' as never,
    });

    act(() => {
      useLongDraftsStore.setState({
        currentLongDraftId: 'doc-1',
        currentSectionId: root.id,
        isTOCVisible: true,
        sectionsMap: new Map([['doc-1', [root, child]]]),
      });
    });
    rerender(<TableOfContents onCreateSection={vi.fn()} />);

    expect(screen.queryByText('Hidden Child')).not.toBeInTheDocument();
    const toggleExpandButton = screen.getByText('Cancelable Root').parentElement?.querySelector('button');
    expect(toggleExpandButton).toBeTruthy();
    fireEvent.click(toggleExpandButton!);
    expect(screen.getByText('Hidden Child')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('Cancelable Root'));
    expect(screen.getByRole('button', { name: 'Delete Section' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Section' }));
    await waitFor(() => {
      expect(deleteSection).not.toHaveBeenCalled();
    });

    fireEvent.contextMenu(screen.getByText('Cancelable Root'));
    fireEvent.click(screen.getByText('Contents'));
    expect(screen.queryByRole('button', { name: 'Delete Section' })).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('supports lock/unlock actions with passkey prompt in section context menu', async () => {
    const root = makeSection({ id: 'lockable-section', title: 'Lockable Section', isLocked: false });
    const updateSection = vi.fn().mockResolvedValue(undefined);

    useSettingsStore.setState({
      hasPasskey: vi.fn().mockResolvedValue(true),
      verifyPasskey: vi.fn().mockImplementation(async (passkey: string) => passkey === 'good-pass'),
      global: {
        ...useSettingsStore.getState().global,
        passkeyHint: 'favorite city',
      },
    });
    useLongDraftsStore.setState({
      currentLongDraftId: 'doc-1',
      currentSectionId: root.id,
      isTOCVisible: true,
      sectionsMap: new Map([['doc-1', [root]]]),
      setCurrentSection: vi.fn(),
      toggleTOC: vi.fn(),
      deleteSection: vi.fn().mockResolvedValue(undefined),
      updateSection,
    });

    const { rerender } = render(<TableOfContents onCreateSection={vi.fn()} />);

    fireEvent.contextMenu(screen.getByText('Lockable Section'));
    fireEvent.click(screen.getByRole('button', { name: 'Lock' }));
    await waitFor(() => {
      expect(updateSection).toHaveBeenCalledWith('lockable-section', { isLocked: true });
    });

    act(() => {
      useLongDraftsStore.setState({
        sectionsMap: new Map([['doc-1', [{ ...root, isLocked: true }]]]),
      });
    });
    rerender(<TableOfContents onCreateSection={vi.fn()} />);

    fireEvent.contextMenu(screen.getByText('Lockable Section'));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(screen.getByRole('dialog', { name: 'Unlock section' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'bad-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid passkey');
    });

    fireEvent.change(screen.getByLabelText('Passkey'), { target: { value: 'good-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    await waitFor(() => {
      expect(updateSection).toHaveBeenCalledWith('lockable-section', { isLocked: false });
    });
  });
});
