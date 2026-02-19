import { fireEvent, render, screen } from '@/test';
import type { ScratchpadPage } from '@/types';
import { useScratchpadStore } from '@/stores/scratchpadStore';
import { PageStack } from './PageStack';

function makePage(overrides: Partial<ScratchpadPage> = {}): ScratchpadPage {
  const now = new Date('2026-02-06T12:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    pageNumber: 1,
    categoryColor: '#BBDEFB',
    categoryName: 'notes',
    textBlockIds: [],
    createdAt: now,
    modifiedAt: now,
    isLocked: false,
    ...overrides,
  };
}

describe('PageStack', () => {
  beforeEach(() => {
    useScratchpadStore.setState(useScratchpadStore.getInitialState(), true);
  });

  it('renders page rows with content and active-state markers', () => {
    const pages = [
      makePage({ pageNumber: 1, textBlockIds: ['a'] }),
      makePage({ pageNumber: 2, textBlockIds: [] }),
      makePage({ pageNumber: 3, textBlockIds: ['b'] }),
    ];

    useScratchpadStore.setState({
      pages,
      currentPageIndex: 1,
    });

    render(<PageStack />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    expect(buttons[0]).toHaveAttribute('data-has-content', 'true');
    expect(buttons[1]).toHaveAttribute('data-has-content', 'false');
    expect(buttons[1]).toHaveAttribute('data-active', 'true');
    expect(buttons[1]).toHaveAttribute('aria-current', 'page');

    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(screen.getByText('Page 3')).toBeInTheDocument();
  });

  it('navigates to selected page on click', () => {
    const pages = [makePage({ pageNumber: 1 }), makePage({ pageNumber: 2 })];
    useScratchpadStore.setState({
      pages,
      currentPageIndex: 0,
    });

    render(<PageStack />);
    fireEvent.click(screen.getByRole('button', { name: /Page 2/i }));

    expect(useScratchpadStore.getState().currentPageIndex).toBe(1);
  });
});
