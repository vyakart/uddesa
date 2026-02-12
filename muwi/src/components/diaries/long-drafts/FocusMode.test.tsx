import { fireEvent, render, screen } from '@/test';
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
});
