import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/puzzles', label: 'Puzzles' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/pricing', label: 'Pricing' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <aside className="sm:w-56 bg-navy text-cream p-4 sm:min-h-screen">
        <div className="mb-6">
          <div className="font-serif text-xl">Admin</div>
          <div className="text-xs text-cream/70 break-words">{user?.email}</div>
        </div>
        <nav className="flex sm:flex-col gap-2 flex-wrap">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? 'bg-brand-orange text-white' : 'hover:bg-navy-soft'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 text-xs">
          <button onClick={logout} className="underline">Sign out</button>{' '}·{' '}
          <a href="/game-start" className="underline">Back to game</a>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-cream/30">
        <Outlet />
      </main>
    </div>
  );
}
