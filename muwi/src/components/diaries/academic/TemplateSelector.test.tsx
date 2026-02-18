import { fireEvent, render, screen } from '@/test';
import { TemplateSelector } from './TemplateSelector';

describe('TemplateSelector', () => {
  it('creates blank paper with default title when no input is provided', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(<TemplateSelector onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));
    expect(onSelect).toHaveBeenCalledWith(
      'Untitled Paper',
      null,
      expect.objectContaining({
        abstract: '',
        keywords: [],
        authors: [],
        customSections: undefined,
      })
    );
  });

  it('creates paper with IMRAD template and metadata fields', () => {
    const onSelect = vi.fn();

    render(<TemplateSelector onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter paper title...'), {
      target: { value: 'AI Research Paper' },
    });
    fireEvent.click(screen.getByRole('button', { name: /IMRAD/i }));
    fireEvent.change(screen.getByPlaceholderText('Summarize the paper in 150-250 words...'), {
      target: { value: 'This paper studies editor workflows.' },
    });
    fireEvent.change(screen.getByPlaceholderText('machine learning, citation analysis, writing workflows'), {
      target: { value: 'ai, writing, citation' },
    });
    fireEvent.change(screen.getByPlaceholderText('First name'), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last name'), {
      target: { value: 'Lovelace' },
    });
    fireEvent.change(screen.getByPlaceholderText('Affiliation'), {
      target: { value: 'Analytical Engine Lab' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));

    expect(onSelect).toHaveBeenCalledWith(
      'AI Research Paper',
      'imrad',
      expect.objectContaining({
        abstract: 'This paper studies editor workflows.',
        keywords: ['ai', 'writing', 'citation'],
        authors: [{ firstName: 'Ada', lastName: 'Lovelace', affiliation: 'Analytical Engine Lab' }],
      })
    );
  });

  it('supports custom structure and multiple authors', () => {
    const onSelect = vi.fn();

    render(<TemplateSelector onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter paper title...'), {
      target: { value: 'Custom Structure Paper' },
    });
    fireEvent.click(screen.getByText('Custom Structure'));
    fireEvent.change(screen.getByPlaceholderText(/Introduction/), {
      target: { value: 'Background\nExperiment\nFindings\nConclusion' },
    });

    fireEvent.change(screen.getByPlaceholderText('First name'), {
      target: { value: 'Grace' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last name'), {
      target: { value: 'Hopper' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Add Author' }));
    fireEvent.change(screen.getAllByPlaceholderText('First name')[1], {
      target: { value: 'Katherine' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Last name')[1], {
      target: { value: 'Johnson' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Paper' }));

    expect(onSelect).toHaveBeenCalledWith(
      'Custom Structure Paper',
      'custom',
      expect.objectContaining({
        authors: [
          { firstName: 'Grace', lastName: 'Hopper', affiliation: undefined },
          { firstName: 'Katherine', lastName: 'Johnson', affiliation: undefined },
        ],
        customSections: ['Background', 'Experiment', 'Findings', 'Conclusion'],
      })
    );
  });
});
