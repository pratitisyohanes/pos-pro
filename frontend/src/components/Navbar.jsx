import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { selectIsAdmin, useAuthStore } from '../store/authStore';
import { selectCartCount, useCartStore } from '../store/cartStore';
import { useLogout } from '../hooks/useLogout';
import { BOOKING_URL } from '../utils/config';
import Logo from './Logo';
import Button from './ui/Button';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'}`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(selectIsAdmin);
  const cartCount = useCartStore(selectCartCount);
  const logout = useLogout();

  const links = [{ to: '/products', label: 'Products' }];
  if (user && !isAdmin) links.push({ to: '/cart', label: cartCount ? `Cart (${cartCount})` : 'Cart' }, { to: '/my-orders', label: 'My Orders' });
  if (isAdmin) links.push({ to: '/admin', label: 'Admin Panel' });

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          <a href={BOOKING_URL} className={linkClass({ isActive: false })}>
            Book a service
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-500">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="secondary" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Log in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d={isOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
      </div>

      {isOpen && (
        <nav className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={(state) => `block ${linkClass(state)}`} onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}
          <a href={BOOKING_URL} className={`block ${linkClass({ isActive: false })}`}>
            Book a service
          </a>
          {user ? (
            <button type="button" onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              Log out
            </button>
          ) : (
            <NavLink to="/login" className={(state) => `block ${linkClass(state)}`} onClick={closeMenu}>
              Log in
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
