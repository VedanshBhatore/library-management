import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

// Gates a route on being logged in and (optionally) holding one of `roles`.
// The API re-checks every rule regardless — this only avoids flashing the
// wrong dashboard to the wrong role.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'LIBRARIAN' ? '/librarian' : '/student'} replace />;
  }
  return children;
}
