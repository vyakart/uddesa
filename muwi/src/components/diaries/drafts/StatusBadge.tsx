import type { DraftStatus } from '@/types/drafts';

interface StatusBadgeProps {
  status: DraftStatus;
  onClick?: () => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const statusConfig: Record<DraftStatus, { label: string; dotColor: string; bgColor: string; borderColor: string }> = {
  'in-progress': {
    label: 'In Progress',
    dotColor: 'var(--color-status-in-progress)',
    bgColor: 'color-mix(in srgb, var(--color-status-in-progress) 14%, transparent)',
    borderColor: 'color-mix(in srgb, var(--color-status-in-progress) 32%, transparent)',
  },
  'review': {
    label: 'Review',
    dotColor: 'var(--color-status-review)',
    bgColor: 'color-mix(in srgb, var(--color-status-review) 14%, transparent)',
    borderColor: 'color-mix(in srgb, var(--color-status-review) 32%, transparent)',
  },
  'complete': {
    label: 'Complete',
    dotColor: 'var(--color-status-complete)',
    bgColor: 'color-mix(in srgb, var(--color-status-complete) 14%, transparent)',
    borderColor: 'color-mix(in srgb, var(--color-status-complete) 32%, transparent)',
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
        color: 'var(--color-text-primary)',
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
          backgroundColor: config.dotColor,
        }}
      />
      {config.label}
    </button>
  );
}
