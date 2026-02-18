declare module 'citeproc' {
  interface RetrieveItem {
    id: string;
    type: string;
    title?: string;
    issued?: { 'date-parts': number[][] };
    author?: Array<{ family?: string; given?: string }>;
    DOI?: string;
    URL?: string;
    volume?: string;
    issue?: string;
    page?: string;
    publisher?: string;
    'container-title'?: string;
  }

  interface EngineSystem {
    retrieveLocale: (lang: string) => string;
    retrieveItem: (id: string) => RetrieveItem | undefined;
  }

  interface CitationCluster {
    citationItems: Array<{
      id: string;
      locator?: string;
      label?: string;
    }>;
    properties: { noteIndex: number };
  }

  interface Engine {
    updateItems(ids: string[]): void;
    appendCitationCluster(citation: CitationCluster): Array<[number, string]>;
    makeBibliography(): [unknown, string[]];
  }

  interface EngineConstructor {
    new (sys: EngineSystem, style: string, lang?: string): Engine;
  }

  const CSL: {
    Engine: EngineConstructor;
  };

  export default CSL;
}
