import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LibrarianDashboardPage from './pages/LibrarianDashboardPage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/librarian"
        element={
          <ProtectedRoute roles={['LIBRARIAN']}>
            <LibrarianDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Sends "/" to the right place: login if signed out, otherwise the
// dashboard matching the current user's role.
function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'LIBRARIAN' ? '/librarian' : '/student'} replace />;
}
