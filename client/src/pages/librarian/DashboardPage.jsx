import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import StatCard from '../../components/StatCard.jsx';
import IssuePanel from '../../components/IssuePanel.jsx';
import ReturnPanel from '../../components/ReturnPanel.jsx';
import { api } from '../../lib/api.js';
import { BookOpenIcon, ClipboardIcon, AlertTriangleIcon, ReceiptIcon } from '../../components/icons.jsx';

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
      <h1 className="page-title">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">A quick look at how the library is running today.</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total titles" value={loading ? '—' : stats.totalTitles} icon={BookOpenIcon} />
        <StatCard label="Copies issued" value={loading ? '—' : stats.copiesIssued} icon={ClipboardIcon} tone="success" />
        <StatCard
          label="Overdue rentals"
          value={loading ? '—' : stats.overdueCount}
          icon={AlertTriangleIcon}
          tone={!loading && stats.overdueCount > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Fines collected (₹)" value={loading ? '—' : stats.finesCollected} icon={ReceiptIcon} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssuePanel onIssued={load} />
        <ReturnPanel onReturned={load} />
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display font-semibold text-slate-900">Overdue books</h3>
        {overdue.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nothing overdue right now.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Book</th>
                  <th className="py-2 pr-4 font-medium">Barcode</th>
                  <th className="py-2 pr-4 font-medium">Due date</th>
                  <th className="py-2 pr-4 font-medium">Days late</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-4">{r.student.name}</td>
                    <td className="py-2 pr-4">{r.copy.book.title}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">{r.copy.barcode}</td>
                    <td className="py-2 pr-4 text-slate-500">{new Date(r.dueDate).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">
                      <span className="badge bg-rose-50 text-rose-700">{r.daysLate}</span>
                    </td>
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
