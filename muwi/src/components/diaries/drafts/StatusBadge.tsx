import type { DraftStatus } from '@/types/drafts';

interface StatusBadgeProps {
  status: DraftStatus;
  onClick?: () => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const statusConfig: Record<DraftStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  'in-progress': {
    label: 'In Progress',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-subtle)',
    borderColor: 'var(--color-warning)',
  },
  'review': {
    label: 'Review',
    color: 'var(--color-info)',
    bgColor: 'var(--color-info-subtle)',
    borderColor: 'var(--color-info)',
  },
  'complete': {
    label: 'Complete',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-subtle)',
    borderColor: 'var(--color-success)',
  },
};

export function StatusBadge({ status, onClick, size = 'md', disabled = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isClickable = !!onClick && !disabled;

  const sizeStyles = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
    },
    md: {
      padding: '4px 10px',
      fontSize: '12px',
    },
  };

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={disabled || !onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: sizeStyles[size].padding,
        fontSize: sizeStyles[size].fontSize,
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '9999px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.filter = 'brightness(0.95)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}
      title={isClickable ? 'Click to change status' : undefined}
    >
      {/* Status dot */}
      <span
        style={{
          width: size === 'sm' ? '6px' : '8px',
          height: size === 'sm' ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {config.label}
    </button>
  );
}
