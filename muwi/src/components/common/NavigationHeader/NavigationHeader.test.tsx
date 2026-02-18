import { fireEvent, render, screen } from '@/test';
import { NavigationHeader } from './NavigationHeader';

describe('NavigationHeader', () => {
  it('shows back link text and diary title', () => {
    render(
      <NavigationHeader title="Personal Diary" icon="📔" onBack={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Back to shelf' })).toHaveTextContent('← Shelf');
    expect(screen.getByRole('heading', { name: 'Personal Diary' })).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<NavigationHeader title="Drafts" onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to shelf' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders right content slot when provided', () => {
    render(
      <NavigationHeader
        title="Drafts"
        onBack={vi.fn()}
        rightContent={<span>Right slot</span>}
      />
    );

    expect(screen.getByText('Right slot')).toBeInTheDocument();
  });
});
