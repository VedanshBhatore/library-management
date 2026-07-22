import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import StatCard from '../../components/StatCard.jsx';
import IssuePanel from '../../components/IssuePanel.jsx';
import ReturnPanel from '../../components/ReturnPanel.jsx';
import { api } from '../../lib/api.js';

export default function LibrarianDashboardPage() {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [dashboard, overdueData] = await Promise.all([
      api.get('/reports/dashboard'),
      api.get('/rentals/overdue'),
    ]);
    setStats(dashboard);
    setOverdue(overdueData.rentals);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total titles" value={loading ? '—' : stats.totalTitles} />
        <StatCard label="Copies issued" value={loading ? '—' : stats.copiesIssued} />
        <StatCard label="Overdue rentals" value={loading ? '—' : stats.overdueCount} accent={!loading && stats.overdueCount > 0 ? 'text-red-600' : undefined} />
        <StatCard label="Fines collected (₹)" value={loading ? '—' : stats.finesCollected} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssuePanel onIssued={load} />
        <ReturnPanel onReturned={load} />
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900">Overdue books</h3>
        {overdue.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Nothing overdue right now.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Book</th>
                  <th className="py-2 pr-4">Barcode</th>
                  <th className="py-2 pr-4">Due date</th>
                  <th className="py-2 pr-4">Days late</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">{r.student.name}</td>
                    <td className="py-2 pr-4">{r.copy.book.title}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.copy.barcode}</td>
                    <td className="py-2 pr-4">{new Date(r.dueDate).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-red-600 font-medium">{r.daysLate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
