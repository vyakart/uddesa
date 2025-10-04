import { NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <NavLink to="/" className="app-shell__brand">
          uddesa
        </NavLink>
        <div className="app-shell__spacer" />
        <nav className="app-shell__nav">
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
        <Outlet />
      </main>
      <div id="toasts" aria-live="polite" className="app-shell__toasts" />
    </div>
  );
}

export default AppShell;
