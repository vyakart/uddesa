declare module 'citation-js' {
  interface FormatOptions {
    format?: 'text' | 'html';
    template?: string;
    lang?: string;
  }

  class Cite {
    constructor(data: unknown);
    data: unknown[];
    format(type: 'citation' | 'bibliography', options?: FormatOptions): string;
  }

  export default Cite;
}
