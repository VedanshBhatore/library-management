import { useAuth } from '../lib/AuthContext.jsx';

// Placeholder — the real librarian dashboard (stat cards, overdue table,
// issue/return panel) is built in Phase 5.
export default function LibrarianDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold text-gray-900">Librarian Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Signed in as {user.name} ({user.email})</p>
        <button
          onClick={logout}
          className="mt-6 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
