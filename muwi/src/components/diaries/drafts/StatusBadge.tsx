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
    color: '#B45309',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  'review': {
    label: 'Review',
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  'complete': {
    label: 'Complete',
    color: '#047857',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
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
