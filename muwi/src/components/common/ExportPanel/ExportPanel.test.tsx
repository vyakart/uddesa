import { fireEvent, render, screen, waitFor } from '@/test';
import { ExportPanel } from './ExportPanel';
import { exportDocument, saveExport } from '@/utils/export';

vi.mock('@/utils/export', () => ({
  exportDocument: vi.fn(),
  saveExport: vi.fn(),
}));

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when closed', () => {
    render(
      <ExportPanel
        isOpen={false}
        onClose={vi.fn()}
        documentType="draft"
        documentTitle="Draft One"
        content="Hello"
      />
    );

    expect(screen.queryByText('Export Document')).not.toBeInTheDocument();
  });

  it('exports successfully with selected options and closes after timeout', async () => {
    vi.mocked(exportDocument).mockResolvedValue(Uint8Array.from([1, 2, 3]));
    vi.mocked(saveExport).mockResolvedValue(true);

    const onClose = vi.fn();
    render(
      <ExportPanel
        isOpen
        onClose={onClose}
        documentType="academic"
        documentTitle="My Paper 2026!"
        content="Main content"
        bibliography={[]}
      />
    );

    expect(screen.getByText('Include bibliography')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /docx/i }));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'letter' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '2' } });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '14' } });
    fireEvent.click(screen.getByLabelText('Include title page'));
    fireEvent.click(screen.getByLabelText('Include page numbers'));

    fireEvent.click(screen.getByRole('button', { name: 'Export DOCX' }));

    await waitFor(() => {
      expect(exportDocument).toHaveBeenCalledWith(
        'academic',
        expect.objectContaining({
          title: 'My Paper 2026!',
          content: 'Main content',
          bibliography: [],
        }),
        expect.objectContaining({
          format: 'docx',
          pageSize: 'letter',
          lineSpacing: 2,
          fontSize: 14,
          includeTitle: false,
          includePageNumbers: false,
          includeBibliography: true,
        })
      );
      expect(saveExport).toHaveBeenCalledWith(expect.any(Uint8Array), 'my-paper-2026-.docx');
      expect(screen.getByText('Successfully exported to my-paper-2026-.docx')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });

  });

  it('shows an error when export fails', async () => {
    vi.mocked(exportDocument).mockRejectedValue(new Error('Export failed hard'));
    vi.mocked(saveExport).mockResolvedValue(true);

    const onClose = vi.fn();
    render(
      <ExportPanel
        isOpen
        onClose={onClose}
        documentType="draft"
        documentTitle="Draft Two"
        content="Body"
      />
    );

    expect(screen.queryByText('Include bibliography')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Export failed hard')).toBeInTheDocument();
      expect(saveExport).not.toHaveBeenCalled();
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
