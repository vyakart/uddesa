interface PageRailPage {
  id: string;
  label: string;
  thumbDataUrl?: string;
  background: string;
}

interface PageRailProps {
  pages: PageRailPage[];
  activePageId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  disableDelete?: boolean;
}

export function PageRail({ pages, activePageId, onSelect, onAdd, onDelete, disableDelete }: PageRailProps) {
  return (
    <div className="page-rail">
      <header className="page-rail__header">
        <span className="page-rail__title">Pages</span>
        <button type="button" className="page-rail__add" onClick={onAdd} aria-label="Add page">
          ＋
        </button>
      </header>
      <ul className="page-rail__list">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <li key={page.id} className={isActive ? 'page-rail__item page-rail__item--active' : 'page-rail__item'}>
              <button
                type="button"
                className="page-rail__thumb"
                onClick={() => onSelect(page.id)}
                aria-pressed={isActive}
                aria-label={`${page.label}${isActive ? ' (active)' : ''}`}
              >
                {page.thumbDataUrl ? (
                  <img src={page.thumbDataUrl} alt={page.label} />
                ) : (
                  <span style={{ background: page.background }} className="page-rail__placeholder">
                    {page.label}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="page-rail__delete"
                onClick={() => onDelete(page.id)}
                disabled={disableDelete}
                aria-label={`Delete ${page.label}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
