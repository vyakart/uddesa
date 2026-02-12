import { fireEvent, render, screen } from '@/test';
import { TemplateSelector } from './TemplateSelector';

describe('TemplateSelector', () => {
  it('creates blank paper with default title when no input is provided', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(<TemplateSelector onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));
    expect(onSelect).toHaveBeenCalledWith('Untitled Paper', null);
  });

  it('creates paper with custom title and selected template', () => {
    const onSelect = vi.fn();

    render(<TemplateSelector onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter paper title...'), {
      target: { value: 'AI Research Paper' },
    });
    fireEvent.click(screen.getByRole('button', { name: /IMRAD/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));

    expect(onSelect).toHaveBeenCalledWith('AI Research Paper', 'imrad');
  });
});
