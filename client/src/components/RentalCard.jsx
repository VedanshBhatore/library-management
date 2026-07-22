import { useState } from 'react';
import { api } from '../lib/api.js';

function daysRemaining(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

// green: plenty of time, amber: 3 days or less, red: overdue.
function colorFor(days) {
  if (days < 0) return { border: 'border-red-300', text: 'text-red-600', bg: 'bg-red-50' };
  if (days <= 3) return { border: 'border-amber-300', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { border: 'border-green-300', text: 'text-green-700', bg: 'bg-green-50' };
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
    <div className={`rounded-xl border p-4 ${color.border} ${color.bg}`}>
      <p className="font-medium text-gray-900">{rental.copy.book.title}</p>
      <p className="text-sm text-gray-500">{rental.copy.book.author}</p>
      <p className={`mt-2 text-sm font-semibold ${color.text}`}>{label}</p>
      <p className="text-xs text-gray-500">Due {new Date(rental.dueDate).toLocaleDateString()}</p>

      <div className="mt-3" title={!rental.renewal.eligible ? rental.renewal.reason : undefined}>
        <button
          onClick={handleRenew}
          disabled={!rental.renewal.eligible || submitting}
          className="w-full rounded-md bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Renewing...' : 'Renew'}
        </button>
      </div>
      {!rental.renewal.eligible && <p className="mt-1 text-xs text-gray-500">{rental.renewal.reason}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
