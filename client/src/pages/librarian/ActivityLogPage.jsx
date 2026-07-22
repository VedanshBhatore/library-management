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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Activity Log</h1>
        <a
          href="/api/rentals/overdue/export"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
        >
          Export overdue report (CSV)
        </a>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-5 text-sm text-gray-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">No activity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 px-4">When</th>
                <th className="py-2 px-4">Actor</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50">
                  <td className="py-2 px-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4">
                    {log.actor.name} <span className="text-gray-400">({log.actor.role})</span>
                  </td>
                  <td className="py-2 px-4 font-medium">{log.action}</td>
                  <td className="py-2 px-4 text-gray-500">
                    {log.entityType} <span className="font-mono text-xs">{log.entityId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
