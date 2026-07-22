import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';

const STATUS_STYLES = {
  WAITING: 'bg-amber-50 text-amber-700',
  READY: 'bg-green-50 text-green-700',
  FULFILLED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
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
      <h1 className="text-xl font-semibold text-gray-900">My Reservations</h1>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : reservations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">You have no reservations.</p>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {reservations.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{r.book.title}</p>
                <p className="text-sm text-gray-500">{r.book.author}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs rounded px-2 py-0.5 font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                {r.status === 'WAITING' && (
                  <p className="text-xs text-gray-500 mt-1">Queue position: #{r.queuePosition}</p>
                )}
                {r.status === 'READY' && r.expiresAt && (
                  <p className="text-xs text-gray-500 mt-1">Pick up by {new Date(r.expiresAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
