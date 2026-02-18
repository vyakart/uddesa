interface TitleBarProps {
  contextLabel?: string | null;
}

export function TitleBar({ contextLabel }: TitleBarProps) {
  const appTitle = contextLabel ? `MUWI — ${contextLabel}` : 'MUWI';

  return (
    <header className="muwi-titlebar" role="banner" aria-label="Application title bar">
      <span className="muwi-titlebar__label">{appTitle}</span>
    </header>
  );
}
