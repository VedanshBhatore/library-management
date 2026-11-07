import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { SparklesIcon, BookOpenIcon, ClockIcon, UsersIcon } from '../components/icons.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'LIBRARIAN' ? '/librarian' : '/student', { replace: true });
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
            <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue to your library.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input mt-1.5"
                  placeholder="you@college.edu"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input mt-1.5"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500 text-center">
              Student?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandPanel() {
  const features = [
    { icon: BookOpenIcon, text: 'Browse the full catalogue in real time' },
    { icon: ClockIcon, text: 'Track due dates, renewals, and fines' },
    { icon: UsersIcon, text: 'Built for students and librarians alike' },
  ];

  return (
    <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-[#1b1140] via-[#2a1470] to-[#4c1fe0] text-white flex-col justify-between px-12 py-14">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-fuchsia-400 shadow-glow">
          <SparklesIcon size={20} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl">Libra</span>
      </div>

      <div className="relative">
        <h2 className="font-display text-3xl font-bold leading-tight">
          Your campus library, <span className="text-brand-300">reimagined.</span>
        </h2>
        <p className="mt-3 text-white/60 max-w-sm">
          Issue, return, renew, and reserve — all in one fast, friendly place.
        </p>

        <ul className="mt-8 space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-white/80">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                <Icon size={15} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/30">Library Management System</p>
    </div>
  );
}
