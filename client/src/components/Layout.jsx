import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

const LIBRARIAN_NAV = [
  { to: '/librarian', label: 'Dashboard', end: true },
  { to: '/librarian/books', label: 'Books' },
  { to: '/librarian/students', label: 'Students' },
  { to: '/librarian/reservations', label: 'Reservations' },
  { to: '/librarian/activity', label: 'Activity Log' },
];

const STUDENT_NAV = [
  { to: '/student', label: 'My Rentals', end: true },
  { to: '/student/catalogue', label: 'Catalogue' },
  { to: '/student/reservations', label: 'Reservations' },
  { to: '/student/fines', label: 'Fines' },
  { to: '/student/history', label: 'History' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = user.role === 'LIBRARIAN' ? LIBRARIAN_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="font-semibold text-gray-900">Library Management</span>
            <nav className="flex gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.name} <span className="text-gray-300">&middot;</span> {user.role}
            </span>
            <button
              onClick={logout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
