import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Banner from '../../components/Banner.jsx';
import { api } from '../../lib/api.js';

export default function FinesPage() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/fines/mine')
      .then(({ fines }) => setFines(fines))
      .finally(() => setLoading(false));
  }, []);

  const unpaidTotal = fines.filter((f) => !f.isPaid).reduce((sum, f) => sum + f.amount, 0);

  return (
    <Layout>
      <h1 className="page-title">My Fines</h1>
      <p className="mt-1 text-sm text-slate-500">Fines are charged ₹5/day for every day a book is returned late.</p>

      {!loading && unpaidTotal > 0 && (
        <div className="mt-3">
          <Banner type="error">
            You owe ₹{unpaidTotal} — settle this with a librarian before borrowing or renewing.
          </Banner>
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : fines.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">You have no fines.</p>
      ) : (
        <div className="mt-5 card divide-y divide-slate-100 overflow-hidden">
          {fines.map((f) => (
            <div key={f.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div>
                <p className="font-medium text-slate-900">{f.rental.copy.book.title}</p>
                <p className="text-sm text-slate-500">
                  Due {new Date(f.rental.dueDate).toLocaleDateString()} &middot; returned{' '}
                  {f.rental.returnDate ? new Date(f.rental.returnDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-semibold text-slate-900">₹{f.amount}</p>
                <span className={`badge mt-1 ${f.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  <span className={`badge-dot ${f.isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {f.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
