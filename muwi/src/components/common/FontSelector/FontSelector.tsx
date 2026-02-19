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
  const containerClasses = ['muwi-font-selector', className ?? null].filter(Boolean).join(' ');

  if (variant === 'context-menu') {
    return (
      <div role="menu" aria-label={`${label} menu`} className={[containerClasses, 'is-menu'].join(' ')}>
        {fonts.map((font) => (
          <button
            key={font}
            type="button"
            role="menuitemradio"
            aria-checked={value === font}
            disabled={disabled}
            onClick={() => onChange(font)}
            className="muwi-font-selector__menu-item"
            data-selected={value === font ? 'true' : 'false'}
            style={{ fontFamily: getPreviewFontFamily(font) }}
          >
            {font}
          </button>
        ))}
      </div>
    );
  }

  return (
    <label className={[containerClasses, 'is-select'].join(' ')}>
      <span className="muwi-font-selector__label">{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="muwi-form-control muwi-font-selector__select"
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
