import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/customers', label: 'Clientes', end: false },
  { to: '/invoices', label: 'Facturas', end: false },
  { to: '/payment-requests', label: 'Solicitudes de pago', end: false },
] as const;

function navLinkClassName(isActive: boolean): string {
  return `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white"
      >
        V
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">Vudy Collections</span>
    </span>
  );
}

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <BrandMark />
        <button
          type="button"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMobileNavOpen((open) => !open)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Menú
        </button>
      </header>

      {isMobileNavOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Navegación principal"
          className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={({ isActive }) => navLinkClassName(isActive)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-8">
            <div className="mb-8 px-2">
              <BrandMark />
            </div>
            <nav aria-label="Navegación principal">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => navLinkClassName(isActive)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-0 lg:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
