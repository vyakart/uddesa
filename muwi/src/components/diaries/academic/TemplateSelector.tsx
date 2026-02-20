import { useMemo, useState } from 'react';
import type { Author, PaperCreationOptions } from '@/types/academic';

interface TemplateSelectorProps {
  onSelect: (title: string, template: string | null, options?: PaperCreationOptions) => void;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  sections: string[];
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank Paper',
    description: 'Start with an empty document',
    sections: [],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
  },
  {
    id: 'imrad',
    name: 'IMRAD',
    description: 'Introduction, Methods, Results, Discussion, Conclusion',
    sections: ['Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  {
    id: 'custom',
    name: 'Custom Structure',
    description: 'Define your own ordered section list',
    sections: ['Abstract', 'Background', 'Analysis', 'Conclusion'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18" />
        <path d="M12 3v18" />
        <path d="M5 5l14 14" />
      </svg>
    ),
  },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border-default)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  backgroundColor: 'var(--color-bg-primary)',
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: '8px',
};

function normalizeAuthors(authors: Author[]): Author[] {
  return authors
    .map((author) => ({
      firstName: author.firstName.trim(),
      lastName: author.lastName.trim(),
      affiliation: author.affiliation?.trim(),
    }))
    .filter((author) => author.firstName || author.lastName)
    .map((author) => ({
      ...author,
      affiliation: author.affiliation || undefined,
    }));
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [paperAbstract, setPaperAbstract] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [customSectionsInput, setCustomSectionsInput] = useState('Introduction\nMethods\nResults\nDiscussion\nConclusion');
  const [authors, setAuthors] = useState<Author[]>([{ firstName: '', lastName: '', affiliation: '' }]);

  const isCustomTemplate = selectedTemplate === 'custom';

  const parsedKeywords = useMemo(
    () =>
      keywordsInput
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    [keywordsInput]
  );

  const parsedCustomSections = useMemo(
    () =>
      customSectionsInput
        .split('\n')
        .map((section) => section.trim())
        .filter(Boolean),
    [customSectionsInput]
  );

  const handleCreate = () => {
    const template = selectedTemplate === 'blank' ? null : selectedTemplate;
    const options: PaperCreationOptions = {
      abstract: paperAbstract.trim(),
      keywords: parsedKeywords,
      authors: normalizeAuthors(authors),
      customSections: selectedTemplate === 'custom' ? parsedCustomSections : undefined,
    };
    onSelect(title || 'Untitled Paper', template, options);
  };

  const updateAuthor = (index: number, field: keyof Author, value: string) => {
    setAuthors((currentAuthors) =>
      currentAuthors.map((author, currentIndex) =>
        currentIndex === index ? { ...author, [field]: value } : author
      )
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: '12px',
          width: '760px',
          maxHeight: '86vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            New Academic Paper
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ marginBottom: '22px' }}>
            <label style={sectionLabelStyle}>Paper Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter paper title..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionLabelStyle}>Choose a Template</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '12px',
              }}
            >
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    padding: '14px',
                    border: `2px solid ${selectedTemplate === template.id ? 'var(--color-accent-default)' : 'var(--color-border-default)'}`,
                    borderRadius: '12px',
                    backgroundColor: selectedTemplate === template.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: selectedTemplate === template.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-tertiary)',
                        color: selectedTemplate === template.id ? 'var(--color-accent-default)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {template.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{template.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {template.description}
                      </div>
                      {template.sections.length > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {template.sections.slice(0, 3).join(' / ')}
                          {template.sections.length > 3 && ` + ${template.sections.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isCustomTemplate && (
            <div style={{ marginBottom: '24px' }}>
              <label style={sectionLabelStyle}>Custom Sections (one per line)</label>
              <textarea
                value={customSectionsInput}
                onChange={(e) => setCustomSectionsInput(e.target.value)}
                rows={5}
                placeholder={'Introduction\nMethods\nResults\nDiscussion\nConclusion'}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionLabelStyle}>Abstract</label>
            <textarea
              value={paperAbstract}
              onChange={(e) => setPaperAbstract(e.target.value)}
              rows={4}
              placeholder="Summarize the paper in 150-250 words..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={sectionLabelStyle}>Keywords (comma-separated)</label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="machine learning, citation analysis, writing workflows"
              style={inputStyle}
            />
            {parsedKeywords.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {parsedKeywords.length} keyword{parsedKeywords.length === 1 ? '' : 's'} detected
              </div>
            )}
          </div>

          <div>
            <label style={sectionLabelStyle}>Authors</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authors.map((author, index) => (
                <div
                  key={`author-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={author.firstName}
                    onChange={(e) => updateAuthor(index, 'firstName', e.target.value)}
                    placeholder="First name"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={author.lastName}
                    onChange={(e) => updateAuthor(index, 'lastName', e.target.value)}
                    placeholder="Last name"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={author.affiliation || ''}
                    onChange={(e) => updateAuthor(index, 'affiliation', e.target.value)}
                    placeholder="Affiliation"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAuthors((currentAuthors) =>
                        currentAuthors.length === 1
                          ? [{ firstName: '', lastName: '', affiliation: '' }]
                          : currentAuthors.filter((_, currentIndex) => currentIndex !== index)
                      )
                    }
                    style={{
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-bg-primary)',
                      color: 'var(--color-text-secondary)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                    aria-label={`Remove author ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setAuthors((currentAuthors) => [
                  ...currentAuthors,
                  { firstName: '', lastName: '', affiliation: '' },
                ])
              }
              style={{
                marginTop: '10px',
                border: '1px solid var(--color-border-default)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-accent-default)',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add Author
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border-default)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--color-accent-default)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Create Paper
          </button>
        </div>
      </div>
    </div>
  );
}
