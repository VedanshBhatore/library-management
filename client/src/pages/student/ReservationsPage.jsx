import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';

const STATUS_STYLES = {
  WAITING: 'bg-amber-50 text-amber-700',
  READY: 'bg-emerald-50 text-emerald-700',
  FULFILLED: 'bg-slate-100 text-slate-600',
  EXPIRED: 'bg-slate-100 text-slate-500',
};
const STATUS_DOTS = {
  WAITING: 'bg-amber-500',
  READY: 'bg-emerald-500',
  FULFILLED: 'bg-slate-400',
  EXPIRED: 'bg-slate-400',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reservations/mine')
      .then(({ reservations }) => setReservations(reservations))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="page-title">My Reservations</h1>
      <p className="mt-1 text-sm text-slate-500">Queue position and pickup windows for titles you've reserved.</p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : reservations.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">You have no reservations.</p>
      ) : (
        <div className="mt-5 card divide-y divide-slate-100 overflow-hidden">
          {reservations.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div>
                <p className="font-medium text-slate-900">{r.book.title}</p>
                <p className="text-sm text-slate-500">{r.book.author}</p>
              </div>
              <div className="text-right">
                <span className={`badge ${STATUS_STYLES[r.status]}`}>
                  <span className={`badge-dot ${STATUS_DOTS[r.status]}`} />
                  {r.status}
                </span>
                {r.status === 'WAITING' && (
                  <p className="text-xs text-slate-500 mt-1.5">Queue position: #{r.queuePosition}</p>
                )}
                {r.status === 'READY' && r.expiresAt && (
                  <p className="text-xs text-slate-500 mt-1.5">Pick up by {new Date(r.expiresAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
