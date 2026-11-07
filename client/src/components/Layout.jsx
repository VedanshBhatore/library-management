import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import {
  LayoutIcon,
  BookOpenIcon,
  UsersIcon,
  BookmarkIcon,
  ActivityIcon,
  ClipboardIcon,
  ReceiptIcon,
  HistoryIcon,
  LogOutIcon,
  SparklesIcon,
} from './icons.jsx';

const LIBRARIAN_NAV = [
  { to: '/librarian', label: 'Dashboard', end: true, icon: LayoutIcon },
  { to: '/librarian/books', label: 'Books', icon: BookOpenIcon },
  { to: '/librarian/students', label: 'Students', icon: UsersIcon },
  { to: '/librarian/reservations', label: 'Reservations', icon: BookmarkIcon },
  { to: '/librarian/activity', label: 'Activity Log', icon: ActivityIcon },
];

const STUDENT_NAV = [
  { to: '/student', label: 'My Rentals', end: true, icon: ClipboardIcon },
  { to: '/student/catalogue', label: 'Catalogue', icon: BookOpenIcon },
  { to: '/student/reservations', label: 'Reservations', icon: BookmarkIcon },
  { to: '/student/fines', label: 'Fines', icon: ReceiptIcon },
  { to: '/student/history', label: 'History', icon: HistoryIcon },
];

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = user.role === 'LIBRARIAN' ? LIBRARIAN_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-[#1b1140] via-[#1f1152] to-[#120a33] text-white">
        <div className="flex items-center gap-2.5 px-6 h-20 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-400 shadow-glow">
            <SparklesIcon size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold leading-tight">Libra</p>
            <p className="text-[11px] text-white/50 leading-tight">Library System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} className={isActive ? 'text-brand-300' : 'text-white/40 group-hover:text-white/70'} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 mt-auto">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-fuchsia-400 text-xs font-bold">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="text-[11px] text-white/40">{user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition"
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <header className="lg:hidden sticky top-0 z-20 bg-[#1b1140] text-white">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-fuchsia-400">
              <SparklesIcon size={15} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm">Libra</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
            <LogOutIcon size={14} /> Log out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 -mt-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
