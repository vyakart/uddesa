import { act, fireEvent, render, screen } from '@/test';
import { useLongDraftsStore } from '@/stores/longDraftsStore';
import type { Section } from '@/types/longDrafts';
import { FocusMode, FocusModeToggle } from './FocusMode';

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T10:00:00.000Z');
  return {
    id: 'section-1',
    longDraftId: 'doc-1',
    title: 'Chapter One',
    content: '<p>Hello world</p>',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 2,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('FocusMode', () => {
  beforeEach(() => {
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  it('renders children normally when focus mode is disabled', () => {
    render(
      <FocusMode>
        <div>Editor Content</div>
      </FocusMode>
    );

    expect(screen.getByText('Editor Content')).toBeInTheDocument();
    expect(screen.queryByText('Exit Focus Mode')).not.toBeInTheDocument();
  });

  it('shows focus mode UI and exits with Escape', () => {
    useLongDraftsStore.setState({
      viewMode: 'focus',
      currentLongDraftId: 'doc-1',
      currentSectionId: 'section-1',
      sectionsMap: new Map([['doc-1', [makeSection()]]]),
    });

    render(
      <FocusMode>
        <div>Focused Editor</div>
      </FocusMode>
    );

    expect(screen.getByText('Focused Editor')).toBeInTheDocument();
    expect(screen.getByText('Chapter One')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exit Focus Mode/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useLongDraftsStore.getState().viewMode).toBe('normal');
  });

  it('toggles focus mode with F11 and Ctrl+Shift+F shortcuts', () => {
    useLongDraftsStore.setState({
      viewMode: 'normal',
      currentLongDraftId: 'doc-1',
      sectionsMap: new Map([['doc-1', [makeSection()]]]),
    });

    render(
      <FocusMode>
        <div>Shortcut Editor</div>
      </FocusMode>
    );

    fireEvent.keyDown(document, { key: 'F11' });
    expect(useLongDraftsStore.getState().viewMode).toBe('focus');

    fireEvent.keyDown(document, { key: 'f', ctrlKey: true, shiftKey: true });
    expect(useLongDraftsStore.getState().viewMode).toBe('normal');
  });

  it('shows and hides focus controls on mouse movement', () => {
    vi.useFakeTimers();
    useLongDraftsStore.setState({
      viewMode: 'focus',
      currentLongDraftId: 'doc-1',
      currentSectionId: 'section-1',
      sectionsMap: new Map([['doc-1', [makeSection()]]]),
    });

    render(
      <FocusMode>
        <div>Timed Focus Content</div>
      </FocusMode>
    );

    const exitButton = screen.getByRole('button', { name: /Exit Focus Mode/i });
    expect(exitButton.parentElement).toHaveStyle({ opacity: '0' });

    fireEvent.mouseMove(screen.getByText('Timed Focus Content'));
    expect(exitButton.parentElement).toHaveStyle({ opacity: '1' });

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(exitButton.parentElement).toHaveStyle({ opacity: '0' });
    vi.useRealTimers();
  });
});

describe('FocusModeToggle', () => {
  beforeEach(() => {
    useLongDraftsStore.setState(useLongDraftsStore.getInitialState(), true);
  });

  it('toggles focus mode from the toolbar button', () => {
    render(<FocusModeToggle />);

    const toggleButton = screen.getByRole('button', { name: /Focus Mode/i });
    fireEvent.click(toggleButton);
    expect(useLongDraftsStore.getState().viewMode).toBe('focus');

    expect(screen.getByRole('button', { name: /Exit Focus/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Exit Focus/i }));
    expect(useLongDraftsStore.getState().viewMode).toBe('normal');
  });

  it('applies hover background only while not in focus mode', () => {
    render(<FocusModeToggle />);

    const toggleButton = screen.getByRole('button', { name: /Focus Mode/i });
    fireEvent.mouseEnter(toggleButton);
    expect(toggleButton).toHaveStyle({ backgroundColor: 'rgb(243, 244, 246)' });

    fireEvent.mouseLeave(toggleButton);
    expect(toggleButton).not.toHaveStyle({ backgroundColor: 'rgb(243, 244, 246)' });
  });
});
