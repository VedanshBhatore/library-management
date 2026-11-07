import { useState } from 'react';
import { api } from '../lib/api.js';
import { ClockIcon } from './icons.jsx';

function daysRemaining(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

// emerald: plenty of time, amber: 3 days or less, rose: overdue.
function colorFor(days) {
  if (days < 0) return { ring: 'ring-rose-200', text: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' };
  if (days <= 3) return { ring: 'ring-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500' };
  return { ring: 'ring-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
}

export default function RentalCard({ rental, onRenewed }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const days = daysRemaining(rental.dueDate);
  const color = colorFor(days);
  const label = days < 0 ? `${Math.abs(days)} day(s) overdue` : days === 0 ? 'Due today' : `${days} day(s) left`;

  async function handleRenew() {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/rentals/${rental.id}/renew`);
      onRenewed?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`card relative overflow-hidden p-4 ring-1 ${color.ring}`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} />
      <p className="font-medium text-slate-900">{rental.copy.book.title}</p>
      <p className="text-sm text-slate-500">{rental.copy.book.author}</p>
      <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${color.bg} ${color.text}`}>
        <ClockIcon size={12} /> {label}
      </p>
      <p className="mt-2 text-xs text-slate-500">Due {new Date(rental.dueDate).toLocaleDateString()}</p>

      <div className="mt-3" title={!rental.renewal.eligible ? rental.renewal.reason : undefined}>
        <button
          onClick={handleRenew}
          disabled={!rental.renewal.eligible || submitting}
          className="btn-secondary w-full"
        >
          {submitting ? 'Renewing...' : 'Renew'}
        </button>
      </div>
      {!rental.renewal.eligible && <p className="mt-1.5 text-xs text-slate-400">{rental.renewal.reason}</p>}
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
