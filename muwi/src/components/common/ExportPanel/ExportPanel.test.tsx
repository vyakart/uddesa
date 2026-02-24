import { fireEvent, render, screen, waitFor } from '@/test';
import { ExportPanel } from './ExportPanel';
import { exportDocument, saveExport } from '@/utils/export';

vi.mock('@/utils/export', () => ({
  exportDocument: vi.fn(),
  saveExport: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

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

  it('shows options per format (PDF/DOCX vs LaTeX)', () => {
    render(
      <ExportPanel
        isOpen
        onClose={vi.fn()}
        documentType="draft"
        documentTitle="Draft One"
        content="Hello"
      />
    );

    expect(screen.getByText('Include page numbers')).toBeInTheDocument();
    expect(screen.getByText('Include header')).toBeInTheDocument();
    expect(screen.getByText('Include footer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tex/i }));

    expect(screen.queryByText('Include page numbers')).not.toBeInTheDocument();
    expect(screen.queryByText('Include header')).not.toBeInTheDocument();
    expect(screen.queryByText('Include footer')).not.toBeInTheDocument();
    expect(
      screen.getByText('Page numbers and header/footer controls are not applied to LaTeX source output.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /docx/i }));

    expect(screen.getByText('Include page numbers')).toBeInTheDocument();
    expect(screen.getByText('Include header')).toBeInTheDocument();
    expect(screen.getByText('Include footer')).toBeInTheDocument();
  });

  it('shows progress indicator and exports with selected options', async () => {
    const exportDeferred = deferred<Uint8Array>();
    const saveDeferred = deferred<string | null>();

    vi.mocked(exportDocument).mockReturnValue(exportDeferred.promise);
    vi.mocked(saveExport).mockReturnValue(saveDeferred.promise);

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

    fireEvent.click(screen.getByRole('button', { name: /docx/i }));
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'letter' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '2' } });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '14' } });
    fireEvent.change(screen.getByPlaceholderText('Header text (optional)'), { target: { value: 'Doc Header' } });
    fireEvent.change(screen.getByPlaceholderText('Footer text (optional)'), { target: { value: 'Doc Footer' } });

    fireEvent.click(screen.getByRole('button', { name: 'Export DOCX' }));

    expect(screen.getByRole('status')).toHaveTextContent('Generating export...');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');

    exportDeferred.resolve(Uint8Array.from([1, 2, 3]));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Saving file...');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '85');
    });

    saveDeferred.resolve('/tmp/my-paper-2026-.docx');

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
          includeHeader: true,
          includeFooter: true,
          headerText: 'Doc Header',
          footerText: 'Doc Footer',
          includeBibliography: true,
        })
      );
      expect(saveExport).toHaveBeenCalledWith(expect.any(Uint8Array), 'my-paper-2026-.docx');
      expect(screen.getByText('Successfully exported to my-paper-2026-.docx')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Successfully exported to my-paper-2026-.docx');
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
  });

  it('shows an error when save location is cancelled', async () => {
    vi.mocked(exportDocument).mockResolvedValue(Uint8Array.from([1, 2, 3]));
    vi.mocked(saveExport).mockResolvedValue(null);

    render(
      <ExportPanel
        isOpen
        onClose={vi.fn()}
        documentType="draft"
        documentTitle="Draft Two"
        content="Body"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Export cancelled or no save location selected.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Export cancelled or no save location selected.');
    });
  });

  it('shows an error when export fails', async () => {
    vi.mocked(exportDocument).mockRejectedValue(new Error('Export failed hard'));
    vi.mocked(saveExport).mockResolvedValue('/tmp/unused.pdf');

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
      expect(screen.getByRole('alert')).toHaveTextContent('Export failed hard');
      expect(saveExport).not.toHaveBeenCalled();
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
