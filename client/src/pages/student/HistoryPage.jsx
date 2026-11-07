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
      <h1 className="page-title">My History</h1>
      <p className="mt-1 text-sm text-slate-500">Every book you've borrowed, past and present.</p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading...</p>
      ) : rentals.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No rental history yet.</p>
      ) : (
        <div className="mt-5 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-100">
                <th className="py-2.5 px-4 font-medium">Book</th>
                <th className="py-2.5 px-4 font-medium">Issued</th>
                <th className="py-2.5 px-4 font-medium">Due</th>
                <th className="py-2.5 px-4 font-medium">Returned</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Fine</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-medium text-slate-900">{r.copy.book.title}</td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{new Date(r.issueDate).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="badge bg-slate-100 text-slate-600">{r.status}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {r.fine ? (
                      <span className={r.fine.isPaid ? 'text-emerald-700' : 'text-rose-600'}>
                        ₹{r.fine.amount} {r.fine.isPaid ? '(paid)' : '(unpaid)'}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
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
