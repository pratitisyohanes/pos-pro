import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold">
      <img src="/logo.webp" alt="" className="h-11 w-11" />
      <span className={`${light ? 'text-white' : 'text-slate-900'} ${compact ? 'lg:hidden' : ''}`}>ELEFEZ FARM</span>
    </Link>
  );
}
