import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { shortcuts, DEFAULT_SHORTCUTS } from '../services/shortcuts';

const ShortcutsModal = lazy(() =>
  import('../ui/ShortcutsModal').then((module) => ({ default: module.ShortcutsModal })),
);

export function AppShell() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const prefetchShortcutsModal = useCallback(() => {
    void import('../ui/ShortcutsModal');
  }, []);

  const openShortcuts = useCallback(() => {
    prefetchShortcutsModal();
    setIsShortcutsOpen(true);
  }, [prefetchShortcutsModal]);

  const closeShortcuts = useCallback(() => {
    setIsShortcutsOpen(false);
  }, []);

  useEffect(() => {
    const shortcut = DEFAULT_SHORTCUTS.showShortcuts;
    const unregister = shortcuts.register({
      key: shortcut.key,
      description: shortcut.description,
      context: shortcut.context,
      handler: () => {
        openShortcuts();
        return true;
      },
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'ctrl') ? { ctrl: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'meta') ? { meta: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'alt') ? { alt: true } : {}),
      ...(Object.prototype.hasOwnProperty.call(shortcut, 'shift') ? { shift: true } : {}),
    });

    return unregister;
  }, [openShortcuts]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <NavLink to="/" className="app-shell__brand">
          uddesa
        </NavLink>
        <div className="app-shell__spacer" />
        <nav className="app-shell__nav">
          <button
            type="button"
            className="app-shell__link"
            onClick={openShortcuts}
            aria-haspopup="dialog"
            aria-controls="shortcuts-modal"
            aria-expanded={isShortcutsOpen}
            onMouseEnter={prefetchShortcutsModal}
            onFocus={prefetchShortcutsModal}
          >
            Shortcuts
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link'
            }
          >
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="app-shell__main">
        <Suspense
          fallback={
            <div className="app-shell__loading" role="status" aria-live="polite">
              Loading…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <div id="toasts" aria-live="polite" className="app-shell__toasts" />
      <Suspense fallback={null}>
        {isShortcutsOpen ? (
          <ShortcutsModal isOpen onClose={closeShortcuts} />
        ) : null}
      </Suspense>
    </div>
  );
}

export default AppShell;
