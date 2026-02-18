import type { ReactNode } from 'react';

interface StatusBarProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function StatusBar({ left, right }: StatusBarProps) {
  return (
    <footer className="muwi-statusbar" role="status" aria-live="polite">
      <div className="muwi-statusbar__left">{left}</div>
      <div className="muwi-statusbar__right">{right}</div>
    </footer>
  );
}
