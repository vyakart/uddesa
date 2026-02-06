import { fireEvent, render, screen } from '@/test';
import type { DiaryEntry } from '@/types';
import { EntryNavigation } from './EntryNavigation';

function makeEntry(date: string, content: string, wordCount: number): DiaryEntry {
  const now = new Date('2026-02-06T09:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    date,
    content,
    wordCount,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
  };
}

describe('EntryNavigation', () => {
  it('lists entries with preview and word count and navigates on click', () => {
    const onDateChange = vi.fn();
    const entries = [
      makeEntry('2026-02-06', '<p>Today was productive and calm.</p>', 5),
      makeEntry('2026-02-05', '', 0),
    ];

    render(
      <EntryNavigation
        entries={entries}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={onDateChange}
      />
    );

    expect(screen.getByText('Feb 6, 2026')).toBeInTheDocument();
    expect(screen.getByText('5 words')).toBeInTheDocument();
    expect(screen.getByText('Empty entry')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Feb 5, 2026/i }));
    const selected = onDateChange.mock.calls[0][0] as Date;
    expect(selected.getDate()).toBe(5);
  });

  it('supports previous, next, and today navigation actions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T08:00:00.000Z'));
    const onDateChange = vi.fn();

    render(
      <EntryNavigation
        entries={[]}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect((onDateChange.mock.calls[0][0] as Date).getDate()).toBe(5);
    expect((onDateChange.mock.calls[1][0] as Date).getDate()).toBe(7);
    expect((onDateChange.mock.calls[2][0] as Date).toISOString().slice(0, 10)).toBe('2026-02-10');

    vi.useRealTimers();
  });

  it('renders collapsed state and supports expanding', () => {
    const onToggleCollapse = vi.fn();
    render(
      <EntryNavigation
        entries={[]}
        currentDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={vi.fn()}
        isCollapsed
        onToggleCollapse={onToggleCollapse}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
