// Export utilities for PDF and Word document generation
import { jsPDF } from 'jspdf';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageBreak,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
} from 'docx';
import type { Section, LongDraft } from '@/types/longDrafts';
import type { Draft } from '@/types/drafts';
import type { DiaryEntry } from '@/types/diary';
import type { AcademicPaper, AcademicSection, BibliographyEntry, CitationStyle } from '@/types/academic';
import { formatBibliography, sortBibliographyByAuthor } from './citation';

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'tex';
  pageSize: 'a4' | 'letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  lineSpacing: 1 | 1.5 | 2;
  fontSize: number;
  fontFamily: string;
  includeTitle: boolean;
  includePageNumbers: boolean;
  includeTableOfContents: boolean;
  includeBibliography: boolean;
}

export const defaultExportOptions: ExportOptions = {
  format: 'pdf',
  pageSize: 'a4',
  margins: { top: 72, right: 72, bottom: 72, left: 72 }, // 1 inch in points
  lineSpacing: 1.5,
  fontSize: 12,
  fontFamily: 'Times New Roman',
  includeTitle: true,
  includePageNumbers: true,
  includeTableOfContents: false,
  includeBibliography: true,
};

// Page dimensions in points (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

// ============================================================================
// HTML to Plain Text Conversion
// ============================================================================

/**
 * Strip HTML tags and convert to plain text
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Replace block elements with newlines
  const blockElements = temp.querySelectorAll('p, div, br, h1, h2, h3, h4, h5, h6, li');
  blockElements.forEach((el) => {
    if (el.tagName === 'BR') {
      el.replaceWith('\n');
    } else {
      el.insertAdjacentText('afterend', '\n');
    }
  });

  return temp.textContent?.trim() || '';
}

/**
 * Parse HTML content into structured blocks for export
 */
interface ContentBlock {
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'list-item' | 'blockquote';
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function parseHtmlToBlocks(html: string): ContentBlock[] {
  if (!html) return [];

  const temp = document.createElement('div');
  temp.innerHTML = html;
  const blocks: ContentBlock[] = [];

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';

    switch (tagName) {
      case 'h1':
        blocks.push({ type: 'heading1', text });
        break;
      case 'h2':
        blocks.push({ type: 'heading2', text });
        break;
      case 'h3':
        blocks.push({ type: 'heading3', text });
        break;
      case 'p':
        if (text) {
          blocks.push({ type: 'paragraph', text });
        }
        break;
      case 'li':
        blocks.push({ type: 'list-item', text: `• ${text}` });
        break;
      case 'blockquote':
        blocks.push({ type: 'blockquote', text });
        break;
      case 'ul':
      case 'ol':
      case 'div':
        // Process children
        el.childNodes.forEach(processNode);
        break;
      default:
        if (text) {
          blocks.push({ type: 'paragraph', text });
        }
    }
  }

  temp.childNodes.forEach(processNode);
  return blocks;
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Export content to PDF
 */
export async function exportToPDF(
  title: string,
  content: string | ContentBlock[],
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const opts = { ...defaultExportOptions, ...options };
  const pageSize = PAGE_SIZES[opts.pageSize];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: opts.pageSize,
  });

  const contentWidth = pageSize.width - opts.margins.left - opts.margins.right;
  let yPosition = opts.margins.top;
  const lineHeight = opts.fontSize * opts.lineSpacing;

  // Helper to add a new page if needed
  const checkPageBreak = (requiredSpace: number = lineHeight * 2) => {
    if (yPosition + requiredSpace > pageSize.height - opts.margins.bottom) {
      pdf.addPage();
      yPosition = opts.margins.top;
    }
  };

  // Add title if enabled
  if (opts.includeTitle && title) {
    pdf.setFontSize(opts.fontSize * 1.5);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(title, contentWidth);
    pdf.text(titleLines, opts.margins.left, yPosition);
    yPosition += lineHeight * 1.5 * titleLines.length + lineHeight;
  }

  // Process content
  const blocks = typeof content === 'string' ? parseHtmlToBlocks(content) : content;

  pdf.setFontSize(opts.fontSize);
  pdf.setFont('helvetica', 'normal');

  for (const block of blocks) {
    checkPageBreak();

    switch (block.type) {
      case 'heading1':
        pdf.setFontSize(opts.fontSize * 1.3);
        pdf.setFont('helvetica', 'bold');
        yPosition += lineHeight * 0.5; // Add space before heading
        break;
      case 'heading2':
        pdf.setFontSize(opts.fontSize * 1.15);
        pdf.setFont('helvetica', 'bold');
        yPosition += lineHeight * 0.3;
        break;
      case 'heading3':
        pdf.setFontSize(opts.fontSize * 1.05);
        pdf.setFont('helvetica', 'bold');
        yPosition += lineHeight * 0.2;
        break;
      case 'blockquote':
        pdf.setFont('helvetica', 'italic');
        break;
      default:
        pdf.setFontSize(opts.fontSize);
        pdf.setFont('helvetica', 'normal');
    }

    const lines = pdf.splitTextToSize(block.text, contentWidth - (block.type === 'blockquote' ? 40 : 0));
    const xOffset = block.type === 'blockquote' ? opts.margins.left + 20 : opts.margins.left;

    for (const line of lines) {
      checkPageBreak();
      pdf.text(line, xOffset, yPosition);
      yPosition += lineHeight;
    }

    // Reset font after heading
    if (block.type.startsWith('heading') || block.type === 'blockquote') {
      pdf.setFontSize(opts.fontSize);
      pdf.setFont('helvetica', 'normal');
    }

    // Add paragraph spacing
    yPosition += lineHeight * 0.3;
  }

  // Add page numbers if enabled
  if (opts.includePageNumbers) {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `${i}`,
        pageSize.width / 2,
        pageSize.height - opts.margins.bottom / 2,
        { align: 'center' }
      );
    }
  }

  return pdf.output('arraybuffer') as unknown as Uint8Array;
}

/**
 * Export Long Draft to PDF
 */
export async function exportLongDraftToPDF(
  document: LongDraft,
  sections: Section[],
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  // Build content blocks from sections
  const blocks: ContentBlock[] = [];

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    // Add section title as heading
    blocks.push({ type: 'heading2', text: section.title });

    // Parse section content
    const sectionBlocks = parseHtmlToBlocks(section.content);
    blocks.push(...sectionBlocks);
  }

  return exportToPDF(document.title, blocks, options);
}

/**
 * Export Academic Paper to PDF
 */
export async function exportAcademicPaperToPDF(
  paper: AcademicPaper,
  sections: AcademicSection[],
  bibliography: BibliographyEntry[],
  citationStyle: CitationStyle = 'apa7',
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const opts = { ...defaultExportOptions, ...options, includeBibliography: true };
  const blocks: ContentBlock[] = [];

  // Add abstract if present
  if (paper.abstract) {
    blocks.push({ type: 'heading2', text: 'Abstract' });
    blocks.push({ type: 'paragraph', text: paper.abstract });

    if (paper.keywords && paper.keywords.length > 0) {
      blocks.push({ type: 'paragraph', text: `Keywords: ${paper.keywords.join(', ')}` });
    }
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    blocks.push({ type: 'heading2', text: section.title });
    const sectionBlocks = parseHtmlToBlocks(section.content);
    blocks.push(...sectionBlocks);
  }

  // Add bibliography
  if (opts.includeBibliography && bibliography.length > 0) {
    blocks.push({ type: 'heading2', text: 'References' });
    const sortedBib = sortBibliographyByAuthor(bibliography);
    const bibHtml = formatBibliography(sortedBib, citationStyle);
    const bibBlocks = parseHtmlToBlocks(bibHtml);
    blocks.push(...bibBlocks);
  }

  return exportToPDF(paper.title, blocks, opts);
}

// ============================================================================
// Word (DOCX) Export
// ============================================================================

/**
 * Export content to Word document
 */
export async function exportToWord(
  title: string,
  content: string | ContentBlock[],
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const opts = { ...defaultExportOptions, ...options };
  const blocks = typeof content === 'string' ? parseHtmlToBlocks(content) : content;

  const children: Paragraph[] = [];

  // Add title if enabled
  if (opts.includeTitle && title) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );
  }

  // Convert blocks to paragraphs
  for (const block of blocks) {
    let paragraph: Paragraph;

    switch (block.type) {
      case 'heading1':
        paragraph = new Paragraph({
          text: block.text,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        });
        break;
      case 'heading2':
        paragraph = new Paragraph({
          text: block.text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        });
        break;
      case 'heading3':
        paragraph = new Paragraph({
          text: block.text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        });
        break;
      case 'blockquote':
        paragraph = new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              italics: true,
            }),
          ],
          indent: { left: 720 }, // 0.5 inch
          spacing: { before: 200, after: 200 },
        });
        break;
      case 'list-item':
        paragraph = new Paragraph({
          text: block.text,
          indent: { left: 360 },
        });
        break;
      default:
        paragraph = new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              size: opts.fontSize * 2, // docx uses half-points
            }),
          ],
          spacing: {
            line: opts.lineSpacing * 240, // 240 = single line spacing
            after: 200,
          },
        });
    }

    children.push(paragraph);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: opts.pageSize === 'a4' ? 11906 : 12240, // in twips
              height: opts.pageSize === 'a4' ? 16838 : 15840,
            },
            margin: {
              top: opts.margins.top * 20, // convert points to twips
              right: opts.margins.right * 20,
              bottom: opts.margins.bottom * 20,
              left: opts.margins.left * 20,
            },
          },
        },
        headers: opts.includePageNumbers
          ? {
              default: new Header({
                children: [new Paragraph({ text: title, alignment: AlignmentType.CENTER })],
              }),
            }
          : undefined,
        footers: opts.includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        children: [PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            }
          : undefined,
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

/**
 * Export Long Draft to Word
 */
export async function exportLongDraftToWord(
  document: LongDraft,
  sections: Section[],
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const blocks: ContentBlock[] = [];
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    blocks.push({ type: 'heading2', text: section.title });
    const sectionBlocks = parseHtmlToBlocks(section.content);
    blocks.push(...sectionBlocks);
  }

  return exportToWord(document.title, blocks, options);
}

/**
 * Export Academic Paper to Word
 */
export async function exportAcademicPaperToWord(
  paper: AcademicPaper,
  sections: AcademicSection[],
  bibliography: BibliographyEntry[],
  citationStyle: CitationStyle = 'apa7',
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array> {
  const opts = { ...defaultExportOptions, ...options, includeBibliography: true };
  const blocks: ContentBlock[] = [];

  // Add abstract
  if (paper.abstract) {
    blocks.push({ type: 'heading2', text: 'Abstract' });
    blocks.push({ type: 'paragraph', text: paper.abstract });

    if (paper.keywords && paper.keywords.length > 0) {
      blocks.push({ type: 'paragraph', text: `Keywords: ${paper.keywords.join(', ')}` });
    }
  }

  // Add sections
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  for (const section of sortedSections) {
    blocks.push({ type: 'heading2', text: section.title });
    const sectionBlocks = parseHtmlToBlocks(section.content);
    blocks.push(...sectionBlocks);
  }

  // Add bibliography
  if (opts.includeBibliography && bibliography.length > 0) {
    blocks.push({ type: 'heading2', text: 'References' });
    const sortedBib = sortBibliographyByAuthor(bibliography);
    const bibHtml = formatBibliography(sortedBib, citationStyle);
    const bibBlocks = parseHtmlToBlocks(bibHtml);
    blocks.push(...bibBlocks);
  }

  return exportToWord(paper.title, blocks, opts);
}

// ============================================================================
// LaTeX Export
// ============================================================================

/**
 * Export content to LaTeX format
 */
export function exportToLaTeX(
  title: string,
  content: string | ContentBlock[],
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultExportOptions, ...options };
  const blocks = typeof content === 'string' ? parseHtmlToBlocks(content) : content;

  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  };

  let latex = `\\documentclass[${opts.fontSize}pt]{article}
\\usepackage[${opts.pageSize === 'a4' ? 'a4paper' : 'letterpaper'}]{geometry}
\\geometry{margin=1in}
\\usepackage{setspace}
\\${opts.lineSpacing === 2 ? 'doublespacing' : opts.lineSpacing === 1.5 ? 'onehalfspacing' : 'singlespacing'}

\\title{${escapeLatex(title)}}
\\date{}

\\begin{document}
`;

  if (opts.includeTitle && title) {
    latex += '\\maketitle\n\n';
  }

  for (const block of blocks) {
    const text = escapeLatex(block.text);

    switch (block.type) {
      case 'heading1':
        latex += `\\section{${text}}\n\n`;
        break;
      case 'heading2':
        latex += `\\subsection{${text}}\n\n`;
        break;
      case 'heading3':
        latex += `\\subsubsection{${text}}\n\n`;
        break;
      case 'blockquote':
        latex += `\\begin{quote}\n${text}\n\\end{quote}\n\n`;
        break;
      case 'list-item':
        latex += `\\begin{itemize}\n\\item ${text.replace(/^• /, '')}\n\\end{itemize}\n\n`;
        break;
      default:
        latex += `${text}\n\n`;
    }
  }

  latex += '\\end{document}\n';

  return latex;
}

/**
 * Export Academic Paper to LaTeX
 */
export function exportAcademicPaperToLaTeX(
  paper: AcademicPaper,
  sections: AcademicSection[],
  bibliography: BibliographyEntry[],
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultExportOptions, ...options };

  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  };

  let latex = `\\documentclass[${opts.fontSize}pt]{article}
\\usepackage[${opts.pageSize === 'a4' ? 'a4paper' : 'letterpaper'}]{geometry}
\\geometry{margin=1in}
\\usepackage{setspace}
\\usepackage{natbib}
\\${opts.lineSpacing === 2 ? 'doublespacing' : opts.lineSpacing === 1.5 ? 'onehalfspacing' : 'singlespacing'}

\\title{${escapeLatex(paper.title)}}
\\author{${paper.authors?.map(a => escapeLatex(a.name)).join(' \\and ') || ''}}
\\date{}

\\begin{document}
\\maketitle

`;

  // Abstract
  if (paper.abstract) {
    latex += `\\begin{abstract}
${escapeLatex(paper.abstract)}
\\end{abstract}

`;

    if (paper.keywords && paper.keywords.length > 0) {
      latex += `\\textbf{Keywords:} ${paper.keywords.map(escapeLatex).join(', ')}

`;
    }
  }

  // Sections
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  for (const section of sortedSections) {
    latex += `\\section{${escapeLatex(section.title)}}
${escapeLatex(htmlToPlainText(section.content))}

`;
  }

  // Bibliography
  if (bibliography.length > 0) {
    latex += `\\begin{thebibliography}{99}
`;
    for (const entry of sortBibliographyByAuthor(bibliography)) {
      const authors = entry.authors.join(', ');
      const year = entry.year || '';
      const title = escapeLatex(entry.title);
      const journal = entry.journal ? `\\textit{${escapeLatex(entry.journal)}}` : '';

      latex += `\\bibitem{${entry.id}} ${escapeLatex(authors)} (${year}). ${title}. ${journal}
`;
    }
    latex += `\\end{thebibliography}
`;
  }

  latex += '\\end{document}\n';

  return latex;
}

// ============================================================================
// Unified Export Function
// ============================================================================

/**
 * Export any document type to the specified format
 */
export async function exportDocument(
  type: 'draft' | 'longDraft' | 'academic' | 'diary',
  data: {
    title: string;
    content?: string;
    sections?: Section[] | AcademicSection[];
    document?: LongDraft | AcademicPaper;
    bibliography?: BibliographyEntry[];
    citationStyle?: CitationStyle;
    entries?: DiaryEntry[];
  },
  options: Partial<ExportOptions> = {}
): Promise<Uint8Array | string> {
  const opts = { ...defaultExportOptions, ...options };

  switch (opts.format) {
    case 'pdf':
      if (type === 'academic' && data.document && data.sections) {
        return exportAcademicPaperToPDF(
          data.document as AcademicPaper,
          data.sections as AcademicSection[],
          data.bibliography || [],
          data.citationStyle || 'apa7',
          opts
        );
      } else if (type === 'longDraft' && data.document && data.sections) {
        return exportLongDraftToPDF(
          data.document as LongDraft,
          data.sections as Section[],
          opts
        );
      } else {
        return exportToPDF(data.title, data.content || '', opts);
      }

    case 'docx':
      if (type === 'academic' && data.document && data.sections) {
        return exportAcademicPaperToWord(
          data.document as AcademicPaper,
          data.sections as AcademicSection[],
          data.bibliography || [],
          data.citationStyle || 'apa7',
          opts
        );
      } else if (type === 'longDraft' && data.document && data.sections) {
        return exportLongDraftToWord(
          data.document as LongDraft,
          data.sections as Section[],
          opts
        );
      } else {
        return exportToWord(data.title, data.content || '', opts);
      }

    case 'tex':
      if (type === 'academic' && data.document && data.sections) {
        const latex = exportAcademicPaperToLaTeX(
          data.document as AcademicPaper,
          data.sections as AcademicSection[],
          data.bibliography || [],
          opts
        );
        return new TextEncoder().encode(latex);
      } else {
        const latex = exportToLaTeX(data.title, data.content || '', opts);
        return new TextEncoder().encode(latex);
      }

    default:
      throw new Error(`Unsupported export format: ${opts.format}`);
  }
}

/**
 * Save exported content using Electron API
 */
export async function saveExport(
  content: Uint8Array,
  filename: string
): Promise<string | null> {
  if (window.electronAPI?.exportFile) {
    return window.electronAPI.exportFile(content, filename);
  }

  // Fallback for web: trigger download
  const blob = new Blob([content]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return filename;
}
