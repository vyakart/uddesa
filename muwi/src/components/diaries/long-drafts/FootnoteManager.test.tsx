import { act, fireEvent, render, screen } from '@/test';
import type { Footnote } from '@/types/longDrafts';
import { FootnoteManager } from './FootnoteManager';

function makeFootnote(overrides: Partial<Footnote> = {}): Footnote {
  return {
    id: crypto.randomUUID(),
    marker: 1,
    content: 'Sample footnote content',
    position: 0,
    ...overrides,
  };
}

describe('FootnoteManager', () => {
  it('shows empty state and allows adding footnotes when unlocked', () => {
    const onAddFootnote = vi.fn();

    render(
      <FootnoteManager
        footnotes={[]}
        isLocked={false}
        onAddFootnote={onAddFootnote}
        onUpdateFootnote={vi.fn()}
        onDeleteFootnote={vi.fn()}
        onNavigateToFootnote={vi.fn()}
      />
    );

    expect(screen.getByText('No footnotes yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Footnote' }));
    expect(onAddFootnote).toHaveBeenCalledTimes(1);
  });

  it('supports navigate, inline edit/save, and context menu delete', () => {
    vi.useFakeTimers();
    const onUpdateFootnote = vi.fn();
    const onDeleteFootnote = vi.fn();
    const onNavigateToFootnote = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const first = makeFootnote({ id: 'fn-1', marker: 1, content: 'First footnote' });
    const second = makeFootnote({ id: 'fn-2', marker: 2, content: 'Second footnote' });

    render(
      <FootnoteManager
        footnotes={[first, second]}
        isLocked={false}
        onAddFootnote={vi.fn()}
        onUpdateFootnote={onUpdateFootnote}
        onDeleteFootnote={onDeleteFootnote}
        onNavigateToFootnote={onNavigateToFootnote}
        highlightedFootnoteId="fn-2"
      />
    );

    expect(screen.getByText('Footnotes (2)')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Go to text' })[0]);
    expect(onNavigateToFootnote).toHaveBeenCalledWith('fn-1');

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const textarea = screen.getByDisplayValue('First footnote');
    fireEvent.change(textarea, { target: { value: 'First footnote updated' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onUpdateFootnote).toHaveBeenCalledWith('fn-1', 'First footnote updated');

    fireEvent.blur(textarea);
    expect(onUpdateFootnote).toHaveBeenCalledWith('fn-1', 'First footnote updated');

    fireEvent.contextMenu(screen.getByText('Second footnote'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteFootnote).toHaveBeenCalledWith('fn-2');

    confirmSpy.mockRestore();
    vi.useRealTimers();
  });

  it('hides add/delete controls when locked and supports canceling edit with Escape', () => {
    const onUpdateFootnote = vi.fn();
    const onDeleteFootnote = vi.fn();
    const lockedFootnote = makeFootnote({ id: 'fn-locked', marker: 1, content: '' });

    const { rerender } = render(
      <FootnoteManager
        footnotes={[]}
        isLocked={true}
        onAddFootnote={vi.fn()}
        onUpdateFootnote={onUpdateFootnote}
        onDeleteFootnote={onDeleteFootnote}
        onNavigateToFootnote={vi.fn()}
      />
    );

    expect(screen.getByText('No footnotes yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Footnote' })).not.toBeInTheDocument();

    rerender(
      <FootnoteManager
        footnotes={[lockedFootnote]}
        isLocked={true}
        onAddFootnote={vi.fn()}
        onUpdateFootnote={onUpdateFootnote}
        onDeleteFootnote={onDeleteFootnote}
        onNavigateToFootnote={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText('Click to add content...'));
    expect(screen.getByRole('button', { name: 'Go to Text' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    rerender(
      <FootnoteManager
        footnotes={[makeFootnote({ id: 'fn-edit', marker: 1, content: 'Editable content' })]}
        isLocked={false}
        onAddFootnote={vi.fn()}
        onUpdateFootnote={onUpdateFootnote}
        onDeleteFootnote={onDeleteFootnote}
        onNavigateToFootnote={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByDisplayValue('Editable content');
    fireEvent.change(textarea, { target: { value: 'Changed then canceled' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(screen.getByText('Editable content')).toBeInTheDocument();
    expect(onUpdateFootnote).not.toHaveBeenCalled();
  });
});
