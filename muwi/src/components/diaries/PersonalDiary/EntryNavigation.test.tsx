import { fireEvent, render, screen } from '@/test';
import type { DiaryEntry } from '@/types';
import { EntryNavigation } from './EntryNavigation';

function makeEntry(
  date: string,
  content: string,
  wordCount: number,
  mood?: string
): DiaryEntry {
  const now = new Date('2026-02-06T09:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    date,
    content,
    wordCount,
    mood,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
  };
}

describe('EntryNavigation', () => {
  it('groups entries by month and retains optional mood indicators', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-06T12:00:00.000Z'));
    const onDateChange = vi.fn();
    const entries = [
      makeEntry('2026-02-06', '<p>Today was productive and calm.</p>', 5, 'happy'),
      makeEntry('2026-02-03', '<p>An early-February checkpoint.</p>', 3),
      makeEntry('2026-01-29', '<p>Late-January review notes.</p>', 4, 'sad'),
    ];

    render(
      <EntryNavigation
        entries={entries}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={onDateChange}
      />
    );

    expect(screen.getByText('February 2026')).toBeInTheDocument();
    expect(screen.getByText('January 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 6, 2026')).toBeInTheDocument();
    expect(screen.getByText('Today was productive and calm.')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByTitle('Mood: happy')).toBeInTheDocument();
    expect(screen.getByTitle('Mood: sad')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Jan 29, 2026/i }));
    const selected = onDateChange.mock.calls[0][0] as Date;
    expect(selected.getDate()).toBe(29);

    vi.useRealTimers();
  });

  it('shows empty-state guidance when there are no entries', () => {
    render(
      <EntryNavigation
        entries={[]}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={vi.fn()}
      />
    );

    expect(screen.getByText('No entries yet. Start writing today!')).toBeInTheDocument();
  });

  it('marks the selected entry as active', () => {
    const entries = [
      makeEntry('2026-02-06', '<p>Today entry</p>', 2),
      makeEntry('2026-02-05', '<p>Yesterday entry</p>', 2),
    ];
    const onDateChange = vi.fn();
    render(
      <EntryNavigation
        entries={entries}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={onDateChange}
      />
    );

    const selectedButton = screen.getByRole('button', { name: /Feb 6, 2026/i });
    const otherButton = screen.getByRole('button', { name: /Feb 5, 2026/i });

    expect(selectedButton).toHaveAttribute('data-active', 'true');
    expect(otherButton).toHaveAttribute('data-active', 'false');
  });
});
