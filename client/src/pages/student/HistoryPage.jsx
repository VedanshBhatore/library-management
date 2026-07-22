import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';

export default function HistoryPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/rentals/history')
      .then(({ rentals }) => setRentals(rentals))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900">My History</h1>

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      ) : rentals.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No rental history yet.</p>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 px-4">Book</th>
                <th className="py-2 px-4">Issued</th>
                <th className="py-2 px-4">Due</th>
                <th className="py-2 px-4">Returned</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Fine</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2 px-4">{r.copy.book.title}</td>
                  <td className="py-2 px-4 text-gray-500">{new Date(r.issueDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4 text-gray-500">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4 text-gray-500">{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}</td>
                  <td className="py-2 px-4">{r.status}</td>
                  <td className="py-2 px-4">
                    {r.fine ? (
                      <span className={r.fine.isPaid ? 'text-green-700' : 'text-red-600'}>
                        ₹{r.fine.amount} {r.fine.isPaid ? '(paid)' : '(unpaid)'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
