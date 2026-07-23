import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

const STATUS_STYLES = {
  WAITING: 'bg-amber-50 text-amber-700',
  READY: 'bg-green-50 text-green-700',
};

export default function ReservationsPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allotting, setAllotting] = useState(null);

  const load = useCallback(async () => {
    const { books } = await api.get('/reservations');
    setBooks(books);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only ever targets whoever is next in line (the READY hold, or the
  // earliest WAITING reservation) — the button doesn't exist for anyone
  // else, so there's no way to allot out of order from this page.
  async function handleAllot(book, reservation, barcode) {
    setAllotting(reservation.id);
    setError('');
    setSuccess('');
    try {
      await api.post('/rentals/issue', { studentId: reservation.student.id, barcode });
      setSuccess(`Issued "${book.title}" to ${reservation.student.name}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAllotting(null);
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900">Reservations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Titles with an open reservation queue, most-reserved first.
      </p>

      <div className="mt-3 space-y-2">
        <Banner type="error">{error}</Banner>
        <Banner type="success">{success}</Banner>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : books.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No open reservations right now.</p>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {books.map(({ book, reservationCount, availableCopies, reservations }) => (
            <div key={book.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
                <span className="flex items-center gap-2">
                  {availableCopies.length > 0 && (
                    <span className="rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1">
                      {availableCopies.length} available
                    </span>
                  )}
                  <span className="rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1">
                    {reservationCount} reservation{reservationCount === 1 ? '' : 's'}
                  </span>
                </span>
              </div>

              <ul className="mt-3 divide-y divide-gray-50 border border-gray-100 rounded-md">
                {reservations.map((r) => {
                  const canAllot = r.isNextInLine && availableCopies.length > 0;
                  return (
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
                        {canAllot && (
                          <button
                            onClick={() => handleAllot(book, r, availableCopies[0].barcode)}
                            disabled={allotting === r.id}
                            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {allotting === r.id ? 'Allotting...' : 'Allot'}
                          </button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
