import { beforeEach, describe, expect, it, vi } from 'vitest';

type JsPdfFormat = 'a4' | 'letter';

type JsPdfOptions = {
  orientation: 'portrait';
  unit: 'pt';
  format: JsPdfFormat;
};

type TextCall = {
  text: string | string[];
  x: number;
  y: number;
  page: number;
  options?: {
    align?: string;
  };
};

type MockPdfShape = {
  options: JsPdfOptions;
  pageCount: number;
  currentPage: number;
  textCalls: TextCall[];
  setFontCalls: Array<[string, string]>;
};

declare global {
  var __mockPdfInstances__: MockPdfShape[] | undefined;
}

function getCreatedPdfs(): MockPdfShape[] {
  return globalThis.__mockPdfInstances__ ?? [];
}

vi.mock('jspdf', () => {
  globalThis.__mockPdfInstances__ = [];

  class MockJsPdf {
    options: JsPdfOptions;
    pageCount = 1;
    currentPage = 1;
    textCalls: TextCall[] = [];
    setFontCalls: Array<[string, string]> = [];

    constructor(options: JsPdfOptions) {
      this.options = options;
      globalThis.__mockPdfInstances__?.push(this as unknown as MockPdfShape);
    }

    addPage(): void {
      this.pageCount += 1;
      this.currentPage = this.pageCount;
    }

    setPage(page: number): void {
      this.currentPage = page;
    }

    getNumberOfPages(): number {
      return this.pageCount;
    }

    setFontSize(size: number): void {
      void size;
    }

    setFont(family: string, style: string): void {
      this.setFontCalls.push([family, style]);
    }

    setTextColor(value: number): void {
      void value;
    }

    setDrawColor(value: number): void {
      void value;
    }

    line(x1: number, y1: number, x2: number, y2: number): void {
      void x1;
      void y1;
      void x2;
      void y2;
    }

    splitTextToSize(text: string, width: number): string[] {
      void width;
      return [text];
    }

    text(
      text: string | string[],
      x: number,
      y: number,
      options?: {
        align?: string;
      }
    ): void {
      this.textCalls.push({ text, x, y, options, page: this.currentPage });
    }

    output(type: 'arraybuffer'): ArrayBuffer {
      void type;
      return new ArrayBuffer(128);
    }
  }

  return { jsPDF: MockJsPdf };
});

import { exportToPDF } from './export';

function latestPdf(): MockPdfShape {
  const pdf = getCreatedPdfs().at(-1);
  if (!pdf) {
    throw new Error('No mocked PDF instance was created');
  }

  return pdf;
}

describe('exportToPDF', () => {
  beforeEach(() => {
    globalThis.__mockPdfInstances__ = [];
  });

  it('uses the configured page size option', async () => {
    await exportToPDF('A4 Title', '<p>Body</p>', {
      pageSize: 'a4',
      includeTitle: false,
      includeHeader: false,
      includeFooter: false,
      includePageNumbers: false,
    });

    await exportToPDF('Letter Title', '<p>Body</p>', {
      pageSize: 'letter',
      includeTitle: false,
      includeHeader: false,
      includeFooter: false,
      includePageNumbers: false,
    });

    expect(getCreatedPdfs()[0]?.options.format).toBe('a4');
    expect(getCreatedPdfs()[1]?.options.format).toBe('letter');
  });

  it('exports text content and preserves heading/list/blockquote formatting', async () => {
    await exportToPDF(
      'Formatting Test',
      '<h1>Main Heading</h1><p>Body text</p><ul><li>First item</li></ul><blockquote>Quoted line</blockquote>',
      {
        includeTitle: false,
        includeHeader: false,
        includeFooter: false,
        includePageNumbers: false,
      }
    );

    const pdf = latestPdf();
    const renderedText = pdf.textCalls.map((call) =>
      Array.isArray(call.text) ? call.text.join(' ') : call.text
    );

    expect(renderedText).toEqual(
      expect.arrayContaining(['Main Heading', 'Body text', '• First item', 'Quoted line'])
    );
    expect(pdf.setFontCalls).toContainEqual(['helvetica', 'bold']);
    expect(pdf.setFontCalls).toContainEqual(['helvetica', 'italic']);
  });

  it('adds header and footer text with page numbers across pages', async () => {
    const longHtml = Array.from({ length: 220 }, (_, index) => `<p>Line ${index + 1}</p>`).join('');

    await exportToPDF('Document Title', longHtml, {
      includeTitle: false,
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      headerText: 'Custom Header',
      footerText: 'Confidential',
    });

    const pdf = latestPdf();
    expect(pdf.pageCount).toBeGreaterThan(1);

    const plainTextCalls = pdf.textCalls.map((call) =>
      Array.isArray(call.text) ? call.text.join(' ') : call.text
    );

    const headerCalls = plainTextCalls.filter((text) => text === 'Custom Header');
    const footerCalls = plainTextCalls.filter((text) => text.includes('Confidential | Page '));

    expect(headerCalls).toHaveLength(pdf.pageCount);
    expect(footerCalls).toHaveLength(pdf.pageCount);
    expect(footerCalls.at(0)).toContain(`Page 1 of ${pdf.pageCount}`);
    expect(footerCalls.at(-1)).toContain(`Page ${pdf.pageCount} of ${pdf.pageCount}`);
  });
});
