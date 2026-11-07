import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/activity')
      .then(({ logs }) => setLogs(logs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="mt-1 text-sm text-slate-500">Every librarian and student action, newest first.</p>
        </div>
        <a href="/api/rentals/overdue/export" className="btn-secondary shrink-0">
          Export overdue report (CSV)
        </a>
      </div>

      <div className="mt-4 card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-100">
                  <th className="py-2.5 px-4 font-medium">When</th>
                  <th className="py-2.5 px-4 font-medium">Actor</th>
                  <th className="py-2.5 px-4 font-medium">Action</th>
                  <th className="py-2.5 px-4 font-medium">Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-4">
                      {log.actor.name} <span className="text-slate-400">({log.actor.role})</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {log.entityType} <span className="font-mono text-xs">{log.entityId}</span>
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
