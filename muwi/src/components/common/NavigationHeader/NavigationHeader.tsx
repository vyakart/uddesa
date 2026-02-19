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
    <header className="muwi-navigation-header">
      <button
        type="button"
        onClick={onBack}
        className="muwi-button muwi-navigation-header__back"
        data-variant="ghost"
        data-size="md"
        data-active="false"
        data-icon-only="false"
        aria-label="Back to shelf"
      >
        ← Shelf
      </button>

      <h1 className="muwi-navigation-header__title">
        {icon ? (
          <span role="img" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {title}
      </h1>

      <div className="muwi-navigation-header__right">{rightContent}</div>
    </header>
  );
}
