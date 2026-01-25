import { useState } from 'react';

interface TemplateSelectorProps {
  onSelect: (title: string, template: string | null) => void;
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
    description: 'Start with a clean slate',
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
    description: 'Introduction, Methods, Results, and Discussion',
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
    id: 'literature-review',
    name: 'Literature Review',
    description: 'Structured review of existing research',
    sections: ['Introduction', 'Methodology', 'Thematic Analysis', 'Discussion', 'Conclusion'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'In-depth analysis of a specific case',
    sections: ['Introduction', 'Background', 'Case Description', 'Analysis', 'Discussion', 'Conclusion'],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: 'thesis',
    name: 'Thesis/Dissertation',
    description: 'Extended academic document structure',
    sections: [
      'Abstract',
      'Introduction',
      'Literature Review',
      'Methodology',
      'Results',
      'Discussion',
      'Conclusion',
      'References',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');

  const handleCreate = () => {
    const template = selectedTemplate === 'blank' ? null : selectedTemplate;
    onSelect(title || 'Untitled Paper', template);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
            New Academic Paper
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Title input */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Paper Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter paper title..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#4A90A4')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Template selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px',
              }}
            >
              Choose a Template
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${selectedTemplate === template.id ? '#4A90A4' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    backgroundColor: selectedTemplate === template.id ? '#EFF6FF' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px',
                        backgroundColor: selectedTemplate === template.id ? '#DBEAFE' : '#F3F4F6',
                        borderRadius: '8px',
                        color: selectedTemplate === template.id ? '#4A90A4' : '#6B7280',
                      }}
                    >
                      {template.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1F2937',
                          marginBottom: '4px',
                        }}
                      >
                        {template.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: template.sections.length > 0 ? '8px' : 0,
                        }}
                      >
                        {template.description}
                      </div>
                      {template.sections.length > 0 && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#9CA3AF',
                          }}
                        >
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
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
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
              backgroundColor: '#4A90A4',
              color: 'white',
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
