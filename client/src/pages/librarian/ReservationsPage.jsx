import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';

const STATUS_STYLES = {
  WAITING: 'bg-amber-50 text-amber-700',
  READY: 'bg-green-50 text-green-700',
};

export default function ReservationsPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reservations')
      .then(({ books }) => setBooks(books))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900">Reservations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Titles with an open reservation queue, most-reserved first.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : books.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No open reservations right now.</p>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {books.map(({ book, reservationCount, reservations }) => (
            <div key={book.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
                <span className="rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1">
                  {reservationCount} reservation{reservationCount === 1 ? '' : 's'}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-gray-50 border border-gray-100 rounded-md">
                {reservations.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      {r.student.name} <span className="text-gray-400">({r.student.email})</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {r.status === 'WAITING' && <span className="text-xs text-gray-500">#{r.queuePosition} in line</span>}
                      {r.status === 'READY' && r.expiresAt && (
                        <span className="text-xs text-gray-500">pick up by {new Date(r.expiresAt).toLocaleString()}</span>
                      )}
                      <span className={`text-xs rounded px-2 py-0.5 font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
