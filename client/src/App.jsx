import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LibrarianDashboardPage from './pages/librarian/DashboardPage.jsx';
import BooksPage from './pages/librarian/BooksPage.jsx';
import StudentsPage from './pages/librarian/StudentsPage.jsx';
import ActivityLogPage from './pages/librarian/ActivityLogPage.jsx';
import StudentDashboardPage from './pages/student/DashboardPage.jsx';
import CataloguePage from './pages/student/CataloguePage.jsx';
import ReservationsPage from './pages/student/ReservationsPage.jsx';
import FinesPage from './pages/student/FinesPage.jsx';
import HistoryPage from './pages/student/HistoryPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/librarian" element={<ProtectedRoute roles={['LIBRARIAN']}><LibrarianDashboardPage /></ProtectedRoute>} />
      <Route path="/librarian/books" element={<ProtectedRoute roles={['LIBRARIAN']}><BooksPage /></ProtectedRoute>} />
      <Route path="/librarian/students" element={<ProtectedRoute roles={['LIBRARIAN']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/librarian/activity" element={<ProtectedRoute roles={['LIBRARIAN']}><ActivityLogPage /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="/student/catalogue" element={<ProtectedRoute roles={['STUDENT']}><CataloguePage /></ProtectedRoute>} />
      <Route path="/student/reservations" element={<ProtectedRoute roles={['STUDENT']}><ReservationsPage /></ProtectedRoute>} />
      <Route path="/student/fines" element={<ProtectedRoute roles={['STUDENT']}><FinesPage /></ProtectedRoute>} />
      <Route path="/student/history" element={<ProtectedRoute roles={['STUDENT']}><HistoryPage /></ProtectedRoute>} />

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
