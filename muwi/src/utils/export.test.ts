import type { AcademicPaper, AcademicSection, BibliographyEntry } from '@/types/academic';
import type { LongDraft, Section } from '@/types/longDrafts';
import {
  exportAcademicPaperToPDF,
  exportAcademicPaperToWord,
  exportAcademicPaperToLaTeX,
  exportDocument,
  exportLongDraftToPDF,
  exportLongDraftToWord,
  exportToPDF,
  exportToLaTeX,
  exportToWord,
  saveExport,
} from './export';

function makePaper(overrides: Partial<AcademicPaper> = {}): AcademicPaper {
  const now = new Date('2026-02-12T13:00:00.000Z');
  return {
    id: 'paper-1',
    title: 'Research & Analysis',
    authors: [{ firstName: 'Ada', lastName: 'Lovelace' }],
    abstract: 'Abstract with symbols & % and _.',
    keywords: ['AI', 'Testing'],
    sectionIds: [],
    citationIds: [],
    bibliographyEntryIds: [],
    figureIds: [],
    tableIds: [],
    settings: {
      citationStyle: 'apa7',
      pageSize: 'a4',
      margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      lineSpacing: 2,
      fontFamily: 'Times New Roman',
      fontSize: 12,
    },
    metadata: {
      createdAt: now,
      modifiedAt: now,
      totalWordCount: 0,
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeSection(overrides: Partial<AcademicSection> = {}): AcademicSection {
  return {
    id: crypto.randomUUID(),
    paperId: 'paper-1',
    title: 'Section',
    content: '<p>Content</p>',
    order: 0,
    parentId: null,
    wordCount: 1,
    ...overrides,
  };
}

function makeLongDraft(overrides: Partial<LongDraft> = {}): LongDraft {
  const now = new Date('2026-02-12T13:00:00.000Z');
  return {
    id: 'long-1',
    title: 'Long Draft',
    sectionIds: [],
    settings: {
      fonts: ['Crimson Pro', 'Inter', 'Georgia'],
      defaultFont: 'Crimson Pro',
      showTOC: true,
      showWordCount: true,
      focusModeEnabled: false,
      typewriterMode: false,
    },
    metadata: {
      createdAt: now,
      modifiedAt: now,
      totalWordCount: 0,
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeLongSection(overrides: Partial<Section> = {}): Section {
  const now = new Date('2026-02-12T13:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    longDraftId: 'long-1',
    title: 'Long Section',
    content: '<p>Long section content</p>',
    order: 0,
    parentId: null,
    footnotes: [],
    status: 'draft',
    notes: '',
    wordCount: 3,
    isLocked: false,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

function makeBibEntry(overrides: Partial<BibliographyEntry> = {}): BibliographyEntry {
  const now = new Date('2026-02-12T13:00:00.000Z');
  return {
    id: crypto.randomUUID(),
    type: 'article',
    authors: ['Smith, John'],
    title: 'Entry Title',
    year: 2024,
    journal: 'Journal',
    tags: [],
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('export utils', () => {
  it('converts HTML content to LaTeX structure and escapes special characters', () => {
    const latex = exportToLaTeX(
      'Title & Test',
      '<h1>Heading 1</h1><p>Para & value</p><blockquote>Quoted text</blockquote><ul><li>Item one</li></ul>',
      { lineSpacing: 2, pageSize: 'letter' }
    );

    expect(latex).toContain('\\title{Title \\& Test}');
    expect(latex).toContain('\\doublespacing');
    expect(latex).toContain('\\section{Heading 1}');
    expect(latex).toContain('Para \\& value');
    expect(latex).toContain('\\begin{quote}');
    expect(latex).toContain('\\item Item one');
    expect(latex).toContain('\\end{document}');
  });

  it('exports academic paper LaTeX with sorted sections and bibliography', () => {
    const paper = makePaper();
    const sections = [
      makeSection({ id: 's2', title: 'Methods', content: '<p>Methods body</p>', order: 1 }),
      makeSection({ id: 's1', title: 'Introduction', content: '<p>Intro body</p>', order: 0 }),
    ];
    const bibliography = [
      makeBibEntry({ id: 'b2', authors: ['Zulu, Zack'], title: 'Z entry' }),
      makeBibEntry({ id: 'b1', authors: ['Adams, Amy'], title: 'A entry' }),
    ];

    const latex = exportAcademicPaperToLaTeX(paper, sections, bibliography, {
      lineSpacing: 1.5,
    });

    expect(latex).toContain('\\author{Ada Lovelace}');
    expect(latex).toContain('\\begin{abstract}');
    expect(latex).toContain('\\textbf{Keywords:} AI, Testing');
    expect(latex.indexOf('\\section{Introduction}')).toBeLessThan(
      latex.indexOf('\\section{Methods}')
    );
    expect(latex.indexOf('\\bibitem{b1}')).toBeLessThan(latex.indexOf('\\bibitem{b2}'));
  });

  it('routes exportDocument by format/type and rejects unsupported formats', async () => {
    const paper = makePaper();
    const sections = [makeSection({ id: 's1', title: 'Intro', content: '<p>Body</p>', order: 0 })];
    const bibliography = [makeBibEntry({ id: 'b1' })];

    const academicTex = await exportDocument(
      'academic',
      {
        title: paper.title,
        document: paper,
        sections,
        bibliography,
        citationStyle: 'apa7',
      },
      { format: 'tex' }
    );
    expect((academicTex as Uint8Array).byteLength).toBeGreaterThan(0);
    expect(new TextDecoder().decode(academicTex as Uint8Array)).toContain('\\begin{thebibliography}');

    const draftTex = await exportDocument(
      'draft',
      { title: 'Draft Title', content: '<p>Draft body</p>' },
      { format: 'tex' }
    );
    expect(new TextDecoder().decode(draftTex as Uint8Array)).toContain('\\title{Draft Title}');

    await expect(
      exportDocument('draft', { title: 'Bad' }, { format: 'foo' as never })
    ).rejects.toThrow('Unsupported export format');
  });

  it('exports PDF and DOCX from direct and long-draft pathways', async () => {
    const html = '<h1>Main</h1><h2>Sub</h2><h3>Minor</h3><p>Body text</p><ul><li>Item</li></ul><blockquote>Quote</blockquote>';

    const pdf = await exportToPDF('PDF Title', html, {
      includePageNumbers: false,
      lineSpacing: 1,
      fontSize: 11,
    });
    expect((pdf as ArrayBuffer).byteLength).toBeGreaterThan(0);

    const word = await exportToWord('Word Title', html, {
      includePageNumbers: true,
      lineSpacing: 2,
      pageSize: 'letter',
    });
    expect(word.byteLength).toBeGreaterThan(0);

    const longDraft = makeLongDraft();
    const longSections = [
      makeLongSection({ id: 'ls2', title: 'Second', order: 1, content: '<p>Second body</p>' }),
      makeLongSection({ id: 'ls1', title: 'First', order: 0, content: '<p>First body</p>' }),
    ];

    const longPdf = await exportLongDraftToPDF(longDraft, longSections, { includeTitle: true });
    expect((longPdf as ArrayBuffer).byteLength).toBeGreaterThan(0);

    const longWord = await exportLongDraftToWord(longDraft, longSections, { includeTitle: true });
    expect(longWord.byteLength).toBeGreaterThan(0);
  });

  it('exports academic PDF/DOCX and routes exportDocument for binary formats', async () => {
    const paper = makePaper();
    const sections = [
      makeSection({ id: 'sa2', title: 'Methods', content: '<p>Methods body</p>', order: 1 }),
      makeSection({ id: 'sa1', title: 'Intro', content: '<p>Intro body</p>', order: 0 }),
    ];
    const bibliography = [
      makeBibEntry({ id: 'ba1', authors: ['Adams, Amy'], title: 'Alpha entry' }),
    ];

    const academicPdf = await exportAcademicPaperToPDF(paper, sections, bibliography, 'apa7', {
      includePageNumbers: true,
    });
    expect((academicPdf as ArrayBuffer).byteLength).toBeGreaterThan(0);

    const academicWord = await exportAcademicPaperToWord(paper, sections, bibliography, 'apa7', {
      includePageNumbers: true,
    });
    expect(academicWord.byteLength).toBeGreaterThan(0);

    const routedAcademicPdf = await exportDocument(
      'academic',
      {
        title: paper.title,
        document: paper,
        sections,
        bibliography,
        citationStyle: 'apa7',
      },
      { format: 'pdf' }
    );
    expect((routedAcademicPdf as ArrayBuffer).byteLength).toBeGreaterThan(0);

    const longDraft = makeLongDraft();
    const longSections = [makeLongSection({ id: 'ls-1', order: 0 })];
    const routedLongDocx = await exportDocument(
      'longDraft',
      {
        title: longDraft.title,
        document: longDraft,
        sections: longSections,
      },
      { format: 'docx' }
    );
    expect((routedLongDocx as Uint8Array).byteLength).toBeGreaterThan(0);

    const routedDraftPdf = await exportDocument(
      'draft',
      {
        title: 'Quick Draft',
        content: '<p>Quick body</p>',
      },
      { format: 'pdf' }
    );
    expect((routedDraftPdf as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });

  it('saves exports using Electron API or browser fallback download', async () => {
    const bytes = new Uint8Array([1, 2, 3]);

    const exportFile = vi.fn().mockResolvedValue('/tmp/export.pdf');
    window.electronAPI.exportFile = exportFile;
    const electronResult = await saveExport(bytes, 'export.pdf');
    expect(exportFile).toHaveBeenCalledWith(bytes, 'export.pdf');
    expect(electronResult).toBe('/tmp/export.pdf');

    delete window.electronAPI.exportFile;
    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const fallbackResult = await saveExport(bytes, 'fallback.bin');
    expect(fallbackResult).toBe('fallback.bin');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock');

    createElementSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
