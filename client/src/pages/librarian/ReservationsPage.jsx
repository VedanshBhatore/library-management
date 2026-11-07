import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

const STATUS_STYLES = {
  WAITING: 'bg-amber-50 text-amber-700',
  READY: 'bg-emerald-50 text-emerald-700',
};
const STATUS_DOTS = {
  WAITING: 'bg-amber-500',
  READY: 'bg-emerald-500',
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

  // Any reserved student can be allotted a copy, not just whoever's first —
  // a no-show shouldn't block the line, so the librarian can hand it to
  // whichever reserved student actually showed up. The server still refuses
  // to issue this book to anyone with *no* reservation while the queue is
  // open; that's the only thing actually locked down.
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
      <h1 className="page-title">Reservations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Titles with an open reservation queue, most-reserved first.
      </p>

      <div className="mt-3 space-y-2">
        <Banner type="error">{error}</Banner>
        <Banner type="success">{success}</Banner>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : books.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No open reservations right now.</p>
      ) : (
        <div className="mt-4 card divide-y divide-slate-100 overflow-hidden">
          {books.map(({ book, reservationCount, availableCopies, reservations }) => (
            <div key={book.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-slate-900">{book.title}</p>
                  <p className="text-sm text-slate-500">{book.author}</p>
                </div>
                <span className="flex items-center gap-2">
                  {availableCopies.length > 0 && (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      <span className="badge-dot bg-emerald-500" />
                      {availableCopies.length} available
                    </span>
                  )}
                  <span className="badge bg-brand-50 text-brand-700">
                    {reservationCount} reservation{reservationCount === 1 ? '' : 's'}
                  </span>
                </span>
              </div>

              <ul className="mt-3 divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {reservations.map((r) => {
                  const canAllot = availableCopies.length > 0;
                  return (
                    <li key={r.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-slate-50/60">
                      <span>
                        {r.student.name} <span className="text-slate-400">({r.student.email})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {r.status === 'WAITING' && <span className="text-xs text-slate-500">#{r.queuePosition} in line</span>}
                        {r.status === 'READY' && r.expiresAt && (
                          <span className="text-xs text-slate-500">pick up by {new Date(r.expiresAt).toLocaleString()}</span>
                        )}
                        {r.isNextInLine && <span className="text-xs text-brand-600 font-medium">next in line</span>}
                        <span className={`badge ${STATUS_STYLES[r.status]}`}>
                          <span className={`badge-dot ${STATUS_DOTS[r.status]}`} />
                          {r.status}
                        </span>
                        {canAllot && (
                          <button
                            onClick={() => handleAllot(book, r, availableCopies[0].barcode)}
                            disabled={allotting === r.id}
                            className="btn-primary py-1 px-2.5 text-xs"
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
