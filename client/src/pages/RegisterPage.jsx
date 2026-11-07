import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { BrandPanel } from './LoginPage.jsx';
import { SparklesIcon } from '../components/icons.jsx';

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
    <div className="min-h-screen lg:flex bg-slate-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-500">
              <SparklesIcon size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg">Libra</span>
          </div>

          <div className="card p-8">
            <h1 className="font-display text-2xl font-bold text-slate-900">Create an account</h1>
            <p className="mt-1 text-sm text-slate-500">Join as a student or librarian.</p>

            <div className="mt-5 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {['STUDENT', 'LIBRARIAN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    role === r
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r === 'STUDENT' ? 'Student' : 'Librarian'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input mt-1.5"
                />
              </div>

              {role === 'STUDENT' && (
                <div>
                  <label htmlFor="enrollmentNo" className="block text-sm font-medium text-slate-700">
                    Enrollment number
                  </label>
                  <input
                    id="enrollmentNo"
                    required
                    value={form.enrollmentNo}
                    onChange={(e) => set('enrollmentNo', e.target.value)}
                    className="input mt-1.5"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="input mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
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
                  className="input mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
              </div>

              {role === 'LIBRARIAN' && (
                <div>
                  <label htmlFor="key" className="block text-sm font-medium text-slate-700">
                    Librarian signup key
                  </label>
                  <input
                    id="key"
                    type="password"
                    required
                    value={form.key}
                    onChange={(e) => set('key', e.target.value)}
                    className="input mt-1.5"
                  />
                  <p className="mt-1 text-xs text-slate-400">Provided separately to library staff.</p>
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
