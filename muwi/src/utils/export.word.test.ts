import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockTextRunShape = {
  options: Record<string, unknown>;
};

type MockParagraphShape = {
  options: Record<string, unknown>;
};

type MockHeaderFooterShape = {
  options: Record<string, unknown>;
};

type MockDocumentShape = {
  options: {
    sections: Array<Record<string, unknown>>;
  };
};

type DocxMockState = {
  documents: MockDocumentShape[];
  packedDocuments: MockDocumentShape[];
};

declare global {
  var __docxMockState__: DocxMockState | undefined;
}

function getDocxState(): DocxMockState {
  return (
    globalThis.__docxMockState__ ?? {
      documents: [],
      packedDocuments: [],
    }
  );
}

vi.mock('docx', () => {
  globalThis.__docxMockState__ = {
    documents: [],
    packedDocuments: [],
  };

  class TextRun {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  }

  class Paragraph {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  }

  class Header {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  }

  class Footer {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  }

  class Document {
    options: {
      sections: Array<Record<string, unknown>>;
    };

    constructor(options: { sections: Array<Record<string, unknown>> }) {
      this.options = options;
      globalThis.__docxMockState__?.documents.push(this as unknown as MockDocumentShape);
    }
  }

  const Packer = {
    toBuffer: vi.fn(async (doc: unknown) => {
      globalThis.__docxMockState__?.packedDocuments.push(doc as MockDocumentShape);
      return new Uint8Array([1, 2, 3, 4]).buffer;
    }),
  };

  return {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel: {
      TITLE: 'TITLE',
      HEADING_1: 'HEADING_1',
      HEADING_2: 'HEADING_2',
      HEADING_3: 'HEADING_3',
    },
    AlignmentType: {
      CENTER: 'CENTER',
    },
    Packer,
    Footer,
    Header,
    PageNumber: {
      CURRENT: 'CURRENT',
      TOTAL_PAGES: 'TOTAL_PAGES',
    },
  };
});

import { exportToWord } from './export';

function latestDocument(): MockDocumentShape {
  const doc = getDocxState().documents.at(-1);
  if (!doc) {
    throw new Error('No mocked DOCX document created');
  }

  return doc;
}

describe('exportToWord', () => {
  beforeEach(() => {
    globalThis.__docxMockState__ = {
      documents: [],
      packedDocuments: [],
    };
  });

  it('applies configured page size and margins', async () => {
    await exportToWord('Word Doc', '<p>Body</p>', {
      pageSize: 'letter',
      margins: { top: 10, right: 20, bottom: 30, left: 40 },
      includeTitle: false,
      includeHeader: false,
      includeFooter: false,
      includePageNumbers: false,
    });

    const section = latestDocument().options.sections[0] as {
      properties: {
        page: {
          size: { width: number; height: number };
          margin: { top: number; right: number; bottom: number; left: number };
        };
      };
    };

    expect(section.properties.page.size).toEqual({ width: 12240, height: 15840 });
    expect(section.properties.page.margin).toEqual({ top: 200, right: 400, bottom: 600, left: 800 });
  });

  it('exports text content and preserves heading/list/blockquote formatting', async () => {
    await exportToWord(
      'Formatting Test',
      '<h1>Main Heading</h1><h2>Sub Heading</h2><h3>Minor Heading</h3><p>Body text</p><ul><li>List item</li></ul><blockquote>Quoted line</blockquote>',
      {
        includeTitle: false,
        includeHeader: false,
        includeFooter: false,
        includePageNumbers: false,
        fontFamily: 'Georgia',
        fontSize: 13,
        lineSpacing: 2,
      }
    );

    const section = latestDocument().options.sections[0] as {
      children: MockParagraphShape[];
    };

    const paragraphs = section.children;

    const headingOne = paragraphs.find(
      (p) => (p.options.heading as string | undefined) === 'HEADING_1'
    );
    const headingOneRun = headingOne?.options.children as MockTextRunShape[] | undefined;

    const bodyParagraph = paragraphs.find(
      (p) =>
        (p.options.children as MockTextRunShape[] | undefined)?.[0]?.options.text === 'Body text'
    );

    const listParagraph = paragraphs.find(
      (p) =>
        (p.options.children as MockTextRunShape[] | undefined)?.[0]?.options.text === 'List item'
    );

    const blockquoteParagraph = paragraphs.find(
      (p) =>
        (p.options.children as MockTextRunShape[] | undefined)?.[0]?.options.text === 'Quoted line'
    );

    expect(headingOneRun?.[0]?.options.bold).toBe(true);
    expect(bodyParagraph?.options.spacing).toEqual(expect.objectContaining({ line: 480 }));
    expect((bodyParagraph?.options.children as MockTextRunShape[])[0]?.options.font).toBe('Georgia');
    expect((bodyParagraph?.options.children as MockTextRunShape[])[0]?.options.size).toBe(26);

    expect(listParagraph?.options.bullet).toEqual({ level: 0 });
    expect(blockquoteParagraph?.options.indent).toEqual({ left: 720 });
    expect((blockquoteParagraph?.options.children as MockTextRunShape[])[0]?.options.italics).toBe(true);
  });

  it('applies header/footer styles and returns packed binary data', async () => {
    const result = await exportToWord('Document Title', '<p>Body</p>', {
      includeHeader: true,
      headerText: 'Custom Header',
      includeFooter: true,
      footerText: 'Confidential',
      includePageNumbers: true,
      fontFamily: 'Times New Roman',
      fontSize: 12,
    });

    const section = latestDocument().options.sections[0] as {
      headers?: { default: MockHeaderFooterShape };
      footers?: { default: MockHeaderFooterShape };
    };

    const headerParagraph = (section.headers?.default.options.children as MockParagraphShape[])[0];
    const headerRun = (headerParagraph.options.children as MockTextRunShape[])[0];

    const footerParagraph = (section.footers?.default.options.children as MockParagraphShape[])[0];
    const footerRuns = footerParagraph.options.children as MockTextRunShape[];

    expect(headerRun.options.text).toBe('Custom Header');
    expect(footerRuns[0]?.options.text).toBe('Confidential');
    expect(footerRuns[1]?.options.text).toBe(' | ');
    expect(footerRuns[2]?.options.children).toEqual(['CURRENT', ' of ', 'TOTAL_PAGES']);

    expect(getDocxState().packedDocuments).toHaveLength(1);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});
