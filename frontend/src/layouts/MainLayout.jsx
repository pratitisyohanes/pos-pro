import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Shared layout for public and customer pages
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} KandangMart. Supplies for layer farms.</p>
          <p>Final Project Full Stack Web Development</p>
        </div>
      </footer>
    </div>
  );
}
