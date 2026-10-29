import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import Logo from '../components/Logo';

const MENU = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/cashier', label: 'Cashier' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/reports', label: 'Reports' },
];

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`;

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar becomes a slide-in drawer on small screens */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 p-4 transition lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 px-2">
          <Logo to="/admin" light />
          <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">Admin panel</p>
        </div>
        <nav className="space-y-1">
          {MENU.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setIsOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4">
          <NavLink to="/" className={linkClass}>
            View shop
          </NavLink>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setIsOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setIsOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <button type="button" onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
