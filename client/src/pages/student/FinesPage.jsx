import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
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
      <h1 className="text-xl font-semibold text-gray-900">My Fines</h1>
      {!loading && unpaidTotal > 0 && (
        <p className="mt-1 text-sm text-red-600">
          You owe ₹{unpaidTotal} — settle this with a librarian before borrowing or renewing.
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : fines.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">You have no fines.</p>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {fines.map((f) => (
            <div key={f.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{f.rental.copy.book.title}</p>
                <p className="text-sm text-gray-500">
                  Due {new Date(f.rental.dueDate).toLocaleDateString()} &middot; returned{' '}
                  {f.rental.returnDate ? new Date(f.rental.returnDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">₹{f.amount}</p>
                <span
                  className={`text-xs rounded px-2 py-0.5 font-medium ${
                    f.isPaid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
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
