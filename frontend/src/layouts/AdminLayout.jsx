import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';
import Logo from '../components/Logo';
import { BarChartIcon, CalculatorIcon, GridIcon, LayersIcon, PackageIcon, ReceiptIcon, StoreIcon, TagIcon } from '../components/icons';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/admin/cashier', label: 'Cashier', icon: CalculatorIcon },
  { to: '/admin/sales', label: 'Sales', icon: ReceiptIcon },
  { to: '/admin/products', label: 'Products', icon: PackageIcon },
  { to: '/admin/categories', label: 'Categories', icon: TagIcon },
  { to: '/admin/stock', label: 'Stock', icon: LayersIcon },
  { to: '/admin/reports', label: 'Reports', icon: BarChartIcon },
];

// When collapsed on desktop the link shrinks to a centered icon; the drawer on small screens is unaffected
const linkClass = (collapsed) => ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  // Same breakpoint as Tailwind's lg: toggle the icon rail on desktop, open the drawer below it
  const handleMenuClick = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) toggleCollapsed();
    else setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar becomes a slide-in drawer on small screens and an icon rail when collapsed on desktop */}
      <aside
        id="admin-sidebar"
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-slate-900 p-4 transition-[width,transform] motion-reduce:transition-none lg:static lg:translate-x-0 ${
          collapsed ? 'lg:w-16 lg:flex-none lg:p-2' : 'lg:flex-none'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`mb-6 px-2 ${collapsed ? 'lg:flex lg:flex-col lg:items-center lg:px-0' : ''}`}>
          <Logo to="/admin" light compact={collapsed} />
          <p className={`mt-1 text-xs uppercase tracking-wider text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>Admin panel</p>
        </div>
        <nav className="space-y-1">
          {MENU.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={label} aria-label={label} className={linkClass(collapsed)} onClick={() => setIsOpen(false)}>
              <Icon className="h-5 w-5 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4">
          <NavLink to="/" title="View shop" aria-label="View shop" className={linkClass(collapsed)}>
            <StoreIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>View shop</span>
          </NavLink>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setIsOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={handleMenuClick}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-controls="admin-sidebar"
            aria-expanded={!collapsed}
          >
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
