import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

// Two self-signup paths: STUDENT (open to anyone) and LIBRARIAN (gated by a
// shared secret key the server checks — see server/.env's
// LIBRARIAN_SIGNUP_KEY and server/src/routes/auth.routes.js). The key is
// never validated here on the client; a wrong or missing key just comes
// back as a 403 from the server.
export default function RegisterPage() {
  const { register, registerLibrarian } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({ name: '', email: '', password: '', enrollmentNo: '', key: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (role === 'STUDENT') {
        await register(form);
        navigate('/student', { replace: true });
      } else {
        await registerLibrarian(form);
        navigate('/librarian', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold text-gray-900">Create an account</h1>

        <div className="mt-4 flex rounded-md border border-gray-200 p-1">
          {['STUDENT', 'LIBRARIAN'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                role === r ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'STUDENT' ? 'Student' : 'Librarian'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {role === 'STUDENT' && (
            <div>
              <label htmlFor="enrollmentNo" className="block text-sm font-medium text-gray-700">
                Enrollment number
              </label>
              <input
                id="enrollmentNo"
                required
                value={form.enrollmentNo}
                onChange={(e) => set('enrollmentNo', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
          </div>

          {role === 'LIBRARIAN' && (
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                Librarian signup key
              </label>
              <input
                id="key"
                type="password"
                required
                value={form.key}
                onChange={(e) => set('key', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">Provided separately to library staff.</p>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
