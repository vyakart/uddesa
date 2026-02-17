import type { CSSProperties } from 'react';

export type FontSelectorVariant = 'select' | 'context-menu';

export interface FontSelectorProps {
  fonts: string[];
  value: string;
  onChange: (font: string) => void;
  label?: string;
  variant?: FontSelectorVariant;
  disabled?: boolean;
  className?: string;
}

function getPreviewFontFamily(font: string): CSSProperties['fontFamily'] {
  return `'${font}', var(--font-family-sans), sans-serif`;
}

export function FontSelector({
  fonts,
  value,
  onChange,
  label = 'Font',
  variant = 'select',
  disabled = false,
  className,
}: FontSelectorProps) {
  if (variant === 'context-menu') {
    return (
      <div
        role="menu"
        aria-label={`${label} menu`}
        className={className}
        style={{ display: 'grid', gap: 2, minWidth: 180 }}
      >
        {fonts.map((font) => (
          <button
            key={font}
            type="button"
            role="menuitemradio"
            aria-checked={value === font}
            disabled={disabled}
            onClick={() => onChange(font)}
            style={{
              textAlign: 'left',
              padding: '6px 8px',
              border: 'none',
              borderRadius: 4,
              cursor: disabled ? 'not-allowed' : 'pointer',
              backgroundColor: value === font ? '#eef4f6' : 'transparent',
              fontFamily: getPreviewFontFamily(font),
              fontSize: 13,
            }}
          >
            {font}
          </button>
        ))}
      </div>
    );
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
      {label}
      <select
        aria-label={label}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className}
        style={{ height: '26px', border: '1px solid #d8d8d8', borderRadius: '4px', fontSize: '12px' }}
      >
        {fonts.map((font) => (
          <option key={font} value={font} style={{ fontFamily: getPreviewFontFamily(font) }}>
            {font}
          </option>
        ))}
      </select>
    </label>
  );
}
