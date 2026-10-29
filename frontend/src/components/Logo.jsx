import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span className={light ? 'text-white' : 'text-slate-900'}>KandangMart</span>
    </Link>
  );
}
