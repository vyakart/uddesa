import type { ReactNode } from 'react';

interface NavigationHeaderProps {
  title: string;
  icon?: string;
  onBack: () => void;
  rightContent?: ReactNode;
}

export function NavigationHeader({
  title,
  icon,
  onBack,
  rightContent,
}: NavigationHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E0E0E0',
      }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#666666',
        }}
        aria-label="Back to shelf"
      >
        ← Shelf
      </button>

      <h1
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#1A1A1A',
        }}
      >
        {icon ? (
          <span role="img" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {title}
      </h1>

      <div style={{ minWidth: '80px' }}>{rightContent}</div>
    </header>
  );
}
